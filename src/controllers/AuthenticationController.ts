// controllers/AuthController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserModel, getUserByEmail, createUser } from "../models/User";
import { RestaurantModel, getRestaurantByEmail } from "../models/Restaurant";
import { RestaurantUnitModel } from "../models/RestaurantUnit";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_change_in_production";

// Funções auxiliares
const generateSalt = () => crypto.randomBytes(16).toString("hex");

const generateHash = (password: string, salt: string) => {
  return crypto
    .createHmac("sha256", salt)
    .update(password)
    .digest("hex");
};

const issueJWT = (id: string, email: string, role: string, expiresIn = "7d") => {
  const payload = {
    sub: id,
    email,
    role,
    iat: Date.now(),
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
  return token;
};

// Login para restaurante (admin)
export const loginRestaurantHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "E-mail e senha são obrigatórios" });
    }

    // Buscar restaurante pelo email do admin
    const restaurant = await getRestaurantByEmail(email);

    if (!restaurant) {
      return res
        .status(401)
        .json({ message: "Credenciais inválidas" });
    }

    // Verificar a senha
    if (!restaurant.authentication || !restaurant.authentication.salt) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const expectedHash = generateHash(password, restaurant.authentication.salt);

    if (expectedHash !== restaurant.authentication.password) {
      return res
        .status(401)
        .json({ message: "Credenciais inválidas" });
    }

    // Gerar token JWT com role "RESTAURANT"
    const token = issueJWT(
      restaurant._id.toString(),
      restaurant.admin.email,
      "RESTAURANT"
    );

    // Atualizar token de sessão no restaurante
    restaurant.authentication.sessionToken = token;
    await restaurant.save();

    // Buscar a unidade principal
    const unit = restaurant.units.length > 0
      ? await RestaurantUnitModel.findById(restaurant.units[0])
      : null;

    return res.status(200).json({
      message: "Login realizado com sucesso",
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        admin: {
          fullName: restaurant.admin.fullName,
          email: restaurant.admin.email
        }
      },
      unit: unit ? {
        _id: unit._id,
        name: unit.name || "Unidade Principal"
      } : null,
      token,
    });
  } catch (error: any) {
    console.error("Erro ao realizar login:", error);
    return res
      .status(500)
      .json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Login para usuários (manager, attendant, client)
export const loginUserHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "E-mail e senha são obrigatórios" });
    }

    // Buscar usuário pelo email
    const user = await UserModel.findOne({ email })
      .select('+authentication.password +authentication.salt');

    if (!user) {
      return res
        .status(401)
        .json({ message: "Credenciais inválidas" });
    }

    // Verificar a senha
    if (!user.authentication || !user.authentication.salt) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const expectedHash = generateHash(password, user.authentication.salt);

    if (expectedHash !== user.authentication.password) {
      return res
        .status(401)
        .json({ message: "Credenciais inválidas" });
    }

    // Gerar token JWT
    if (!user.email) {
      return res.status(400).json({ message: "E-mail do usuário não encontrado" });
    }

    const token = issueJWT(
      user._id.toString(),
      user.email,
      user.role
    );

    // Atualizar token de sessão no usuário
    user.authentication.sessionToken = token;
    await user.save();

    // Se for gerente ou atendente, buscar informações do restaurante
    let restaurantInfo = null;
    if (["MANAGER", "ATTENDANT"].includes(user.role)) {
      if (user.restaurantUnit) {
        const unit = await RestaurantUnitModel.findById(user.restaurantUnit);
        if (unit) {
          restaurantInfo = {
            unit: {
              _id: unit._id,
              name: unit.name || `Unidade ${unit._id}`
            }
          };

          if (user.restaurant) {
            const restaurant = await RestaurantModel.findById(user.restaurant);
            if (restaurant) {
              restaurantInfo.unit = {
                _id: restaurant._id,
                name: restaurant.name
              };
            }
          }
        }
      }
    }

    return res.status(200).json({
      message: "Login realizado com sucesso",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      restaurantInfo,
      token
    });
  } catch (error: any) {
    console.error("Erro ao realizar login de usuário:", error);
    return res
      .status(500)
      .json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Rota unificada de login que decide qual handler usar
export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { email, password, userType } = req.body;

    // Se userType for especificado, usamos o handler apropriado
    if (userType === 'restaurant') {
      return loginRestaurantHandler(req, res);
    } else if (userType === 'user') {
      return loginUserHandler(req, res);
    }

    // Se userType não for especificado, tentamos descobrir o tipo
    // Primeiro tentamos como restaurante
    const restaurant = await getRestaurantByEmail(email);
    if (restaurant) {
      return loginRestaurantHandler(req, res);
    }

    // Se não encontrar como restaurante, tenta como usuário
    return loginUserHandler(req, res);
  } catch (error: any) {
    console.error("Erro ao realizar login:", error);
    return res
      .status(500)
      .json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Registrar um novo restaurante
export const registerRestaurantHandler = async (req: Request, res: Response) => {
  console.log("Recebendo requisição de registro de restaurante");

  try {
    const {
      firstName,
      lastName,
      cpf,
      email,
      password,
      phone,
      name,
      restaurantLogo,
      cnpj,
      socialName,
      address,
      specialty,
    } = req.body;

    console.log("Validando campos obrigatórios...");

    // Validar campos obrigatórios
    if (!firstName || !lastName || !email || !password || !name || !cpf || !cnpj) {
      return res
        .status(400)
        .json({ message: "Todos os campos obrigatórios devem ser preenchidos" });
    }

    console.log("Verificando email existente...");

    // Verificar se o email já está em uso
    const existingRestaurantByEmail = await RestaurantModel.findOne({ "admin.email": email }).lean();
    if (existingRestaurantByEmail) {
      return res
        .status(400)
        .json({ message: "Este e-mail já está em uso" });
    }

    console.log("Verificando nome de restaurante existente...");

    // Verificar se o nome do restaurante já está em uso
    const existingRestaurantByName = await RestaurantModel.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') }
    }).lean();

    if (existingRestaurantByName) {
      return res
        .status(400)
        .json({ message: "Este nome de restaurante já está em uso" });
    }

    console.log("Gerando hash da senha...");

    // Criar hash da senha
    const salt = generateSalt();
    const hash = generateHash(password, salt);

    console.log("Criando documento do restaurante...");

    // Criar o restaurante com todas as informações, SEM referência às unidades
    const restaurantData = {
      name: name,
      logo: restaurantLogo || "",
      cnpj,
      socialName: socialName || name,
      address: address || {
        zipCode: "",
        street: "",
        number: 0,
        complement: ""
      },
      specialty: specialty || "",
      phone: phone || "",
      admin: {
        fullName: firstName + " " + lastName,
        cpf,
        email,
        phone: phone || ""
      },
      authentication: {
        password: hash,
        salt,
        sessionToken: ""
      },
      units: [], // Array vazio, será preenchido depois
      attendants: []
    };

    // Criar e salvar o restaurante
    console.log("Salvando restaurante no banco de dados...");
    const restaurant = new RestaurantModel(restaurantData);
    const savedRestaurant = await restaurant.save();
    console.log("Restaurante salvo com ID:", savedRestaurant._id);

    console.log("Gerando token JWT...");

    // Gerar token JWT para autenticação imediata com role "RESTAURANT"
    const token = issueJWT(
      savedRestaurant._id.toString(),
      savedRestaurant.admin.email,
      "RESTAURANT" // Role específica para restaurantes
    );

    console.log("Atualizando token de sessão...");

    // Atualizar token de sessão no restaurante
    await RestaurantModel.findByIdAndUpdate(
      savedRestaurant._id,
      { "authentication.sessionToken": token }
    );
    console.log("Token atualizado com sucesso");

    console.log("Cadastro concluído com sucesso");

    // Retornar resposta
    return res.status(201).json({
      message: "Restaurante criado com sucesso",
      restaurant: {
        _id: savedRestaurant._id,
        name: savedRestaurant.name,
        admin: {
          fullName: savedRestaurant.admin.fullName,
          email: savedRestaurant.admin.email
        },
      },
      token,
    });
  } catch (error: any) {
    console.error("Erro ao registrar restaurante:", error);
    return res
      .status(500)
      .json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Registrar um novo cliente (usuário final)
export const registerClientHandler = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, cpf, phone, tableId, restaurantUnitId } = req.body;

    // Validar campos obrigatórios
    if (!firstName || !lastName || !email || !password || !cpf) {
      return res
        .status(400)
        .json({ message: "Todos os campos são obrigatórios" });
    }

    // Verificar se o email já está em uso
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Este e-mail já está em uso" });
    }

    // Verificar se a unidade do restaurante existe
    if (restaurantUnitId) {
      const restaurantUnit = await RestaurantUnitModel.findById(restaurantUnitId);
      if (!restaurantUnit) {
        return res
          .status(400)
          .json({ message: "Unidade de restaurante não encontrada" });
      }
    }

    // Criar hash da senha
    const salt = generateSalt();
    const hash = generateHash(password, salt);

    // Criar o novo usuário com role CLIENT
    const newUser = await createUser({
      firstName,
      lastName,
      email,
      cpf,
      phone: phone || "",
      authentication: {
        password: hash,
        salt,
        sessionToken: "",
      },
      role: "CLIENT",
      orders: [],
    });

    // Gerar token JWT para autenticação imediata
    if (!newUser.email || !newUser.role) {
      throw new Error("Email or role is undefined for the new user.");
    }
    const token = issueJWT(newUser._id.toString(), newUser.email, newUser.role);

    // Atualizar token de sessão no banco de dados
    await UserModel.findByIdAndUpdate(newUser._id, {
      "authentication.sessionToken": token
    });

    // Se tiver tableId e restaurantUnitId, salvar no localStorage (frontend)
    return res.status(201).json({
      message: "Usuário criado com sucesso",
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
      token,
      restaurantUnitId,
      tableId,
    });
  } catch (error: any) {
    console.error("Erro ao registrar cliente:", error);
    return res
      .status(500)
      .json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Registrar um manager (por um restaurante)
export const registerManagerHandler = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, cpf, phone, restaurantUnitId } = req.body;

    // Validar campos obrigatórios
    if (!firstName || !lastName || !email || !password || !restaurantUnitId || !cpf) {
      return res
        .status(400)
        .json({ message: "Todos os campos são obrigatórios" });
    }

    // Verificar se o email já está em uso
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Este e-mail já está em uso" });
    }

    // Verificar se a unidade do restaurante existe
    const restaurantUnit = await RestaurantUnitModel.findById(restaurantUnitId);
    if (!restaurantUnit) {
      return res
        .status(400)
        .json({ message: "Unidade de restaurante não encontrada" });
    }

    // Verificar se o usuário atual é um restaurante admin
    if (!req.isRestaurantAdmin || !req.restaurant) {
      return res
        .status(403)
        .json({ message: "Apenas administradores de restaurante podem cadastrar gerentes" });
    }

    // Verificar se a unidade pertence ao restaurante
    const restaurantId = req.restaurant._id;
    const unitBelongsToRestaurant = await RestaurantModel.findOne({
      _id: restaurantId,
      units: restaurantUnitId
    });

    if (!unitBelongsToRestaurant) {
      return res
        .status(403)
        .json({ message: "Esta unidade não pertence ao seu restaurante" });
    }

    // Criar hash da senha
    const salt = generateSalt();
    const hash = generateHash(password, salt);

    // Criar o novo usuário com role MANAGER
    const newUser = await createUser({
      firstName,
      lastName,
      email,
      cpf,
      phone: phone || "",
      authentication: {
        password: hash,
        salt,
        sessionToken: "",
      },
      role: "MANAGER",
      orders: [],
      restaurant: restaurantId,
      restaurantUnit: restaurantUnitId
    });

    // Atualizar a unidade do restaurante com o novo gerente
    restaurantUnit.manager = `${firstName} ${lastName}`;
    await restaurantUnit.save();

    return res.status(201).json({
      message: "Gerente criado com sucesso",
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      }
    });
  } catch (error: any) {
    console.error("Erro ao registrar gerente:", error);
    return res
      .status(500)
      .json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Registrar um atendente (por um admin de restaurante ou gerente)
export const registerAttendantHandler = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, cpf, phone, restaurantUnitId } = req.body;

    // Validar campos obrigatórios
    if (!firstName || !lastName || !email || !password || !restaurantUnitId || !cpf) {
      return res
        .status(400)
        .json({ message: "Todos os campos são obrigatórios" });
    }

    // Verificar se o email já está em uso
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Este e-mail já está em uso" });
    }

    // Verificar se a unidade do restaurante existe
    const restaurantUnit = await RestaurantUnitModel.findById(restaurantUnitId);
    if (!restaurantUnit) {
      return res
        .status(400)
        .json({ message: "Unidade de restaurante não encontrada" });
    }

    // Verificar se o usuário atual é admin do restaurante ou gerente
    let restaurantId;

    if (req.isRestaurantAdmin && req.restaurant) {
      // Admin do restaurante
      restaurantId = req.restaurant._id;

      // Verificar se a unidade pertence ao restaurante
      const unitBelongsToRestaurant = await RestaurantModel.findOne({
        _id: restaurantId,
        units: restaurantUnitId
      });

      if (!unitBelongsToRestaurant) {
        return res
          .status(403)
          .json({ message: "Esta unidade não pertence ao seu restaurante" });
      }
    } else if (req.user && req.user.role === "MANAGER") {
      // Gerente
      restaurantId = req.user.restaurant;

      // Verificar se o gerente é responsável por esta unidade
      if (req.user.restaurantUnit?.toString() !== restaurantUnitId) {
        return res
          .status(403)
          .json({ message: "Você só pode cadastrar atendentes para sua unidade" });
      }
    } else {
      return res
        .status(403)
        .json({ message: "Acesso negado. Apenas administradores e gerentes podem cadastrar atendentes" });
    }

    // Criar hash da senha
    const salt = generateSalt();
    const hash = generateHash(password, salt);

    // Criar o novo usuário com role ATTENDANT
    const newUser = await createUser({
      firstName,
      lastName,
      email,
      cpf,
      phone: phone || "",
      authentication: {
        password: hash,
        salt,
        sessionToken: "",
      },
      role: "ATTENDANT",
      orders: [],
      restaurant: restaurantId,
      restaurantUnit: restaurantUnitId
    });

    // Atualizar a unidade do restaurante com o novo atendente
    await RestaurantUnitModel.findByIdAndUpdate(
      restaurantUnitId,
      { $push: { attendants: newUser._id } }
    );

    return res.status(201).json({
      message: "Atendente criado com sucesso",
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      }
    });
  } catch (error: any) {
    console.error("Erro ao registrar atendente:", error);
    return res
      .status(500)
      .json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Verificar token JWT (útil para validação de sessão)
export const validateTokenHandler = async (req: Request, res: Response) => {
  try {
    // O middleware de autenticação já deve ter verificado o token e preenchido req.user ou req.restaurant

    if (req.isRestaurantAdmin && req.restaurant) {
      // É um admin de restaurante
      const restaurant = req.restaurant;

      // Buscar unidades do restaurante
      const units = await RestaurantUnitModel.find({
        _id: { $in: restaurant.units }
      }).select('_id name');

      return res.status(200).json({
        isValid: true,
        userType: 'restaurant',
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          admin: {
            fullName: restaurant.admin.fullName,
            email: restaurant.admin.email
          }
        },
        units: units || []
      });
    } else if (req.user) {
      // É um usuário normal
      const user = req.user;

      // Inicializar restaurantInfo como null
      let restaurantInfo = null;

      // Verificar se o usuário tem role que necessita de informações de restaurante
      if (["MANAGER", "ATTENDANT"].includes(user.role)) {
        // Se o usuário tiver a referência ao restaurantUnit, buscar informações
        if (user.restaurantUnit) {
          try {
            const unit = await RestaurantUnitModel.findById(user.restaurantUnit);

            if (unit) {
              // Buscar o restaurante associado, se existir
              const restaurant = user.restaurant
                ? await RestaurantModel.findById(user.restaurant)
                : null;

              restaurantInfo = {
                restaurant: restaurant ? {
                  _id: restaurant._id,
                  name: restaurant.name,
                } : undefined,
                unit: {
                  _id: unit._id,
                  name: unit.socialName || `Unidade ${unit._id}`
                }
              };
            }
          } catch (error) {
            console.error("Erro ao buscar informações do restaurante:", error);
            // Continuar mesmo se houver erro ao buscar restaurante
          }
        }
      }

      return res.status(200).json({
        isValid: true,
        userType: 'user',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        restaurantInfo
      });
    } else {
      return res.status(401).json({
        isValid: false,
        message: "Token inválido ou expirado"
      });
    }
  } catch (error: any) {
    console.error("Erro ao validar token:", error);
    return res.status(500).json({
      isValid: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
};

// Logout para usuários e restaurantes
export const logoutHandler = async (req: Request, res: Response) => {
  try {
    if (req.isRestaurantAdmin && req.restaurant) {
      // Logout de restaurante
      await RestaurantModel.findByIdAndUpdate(req.restaurant._id, {
        "authentication.sessionToken": ""
      });
    } else if (req.user) {
      // Logout de usuário
      await UserModel.findByIdAndUpdate(req.user._id, {
        "authentication.sessionToken": ""
      });
    } else {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    return res.status(200).json({ message: "Logout realizado com sucesso" });
  } catch (error: any) {
    console.error("Erro ao realizar logout:", error);
    return res
      .status(500)
      .json({ message: "Erro interno do servidor", error: error.message });
  }
};

// Validação para convidados (guest token)
export const validateGuestTokenHandler = async (req: Request, res: Response) => {
  try {
    const { guestToken, tableId, restaurantId } = req.body;

    if (!guestToken || !tableId || !restaurantId) {
      return res.status(400).json({
        isValid: false,
        message: "Token de convidado, ID da mesa e ID do restaurante são obrigatórios"
      });
    }

    // Buscar informações do restaurante
    const restaurant = await RestaurantModel.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        isValid: false,
        message: "Restaurante não encontrado"
      });
    }

    return res.status(200).json({
      isValid: true,
      guestInfo: {
        tableId,
        restaurantId,
        restaurantName: restaurant.name,
        isGuest: true
      }
    });
  } catch (error: any) {
    console.error("Erro ao validar token de convidado:", error);
    return res.status(500).json({
      isValid: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
};