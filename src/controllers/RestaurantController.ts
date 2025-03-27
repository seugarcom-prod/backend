import express from "express";
import {
  createRestaurant,
  deleteRestaurant,
  getRestaurantById,
  getRestaurantByName,
  getRestaurants,
  RestaurantModel,
  updateRestaurant,
  getRestaurantByEmail,
} from "../models/Restaurant.ts";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { RestaurantUnitModel } from "../models/RestaurantUnit.ts";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_change_in_production";

const generateSalt = () => crypto.randomBytes(16).toString("hex");

const generateHash = (password: string, salt: string) => {
  return crypto
    .createHmac("sha256", salt)
    .update(password)
    .digest("hex");
};

const issueJWT = (restaurantId: string, email: string, expiresIn = "7d") => {
  const payload = {
    sub: restaurantId,
    email,
    role: "RESTAURANT",  // Role específica para restaurantes
    iat: Date.now(),
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
  return token;
};

export const registerRestaurantHandler = async (req: express.Request, res: express.Response) => {
  console.log("Recebendo requisição de registro simplificada - sem unidades");

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

    // Gerar token JWT para autenticação imediata
    const token = issueJWT(
      savedRestaurant._id.toString(),
      savedRestaurant.admin.email
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

export const loginRestaurantHandler = async (req: express.Request, res: express.Response) => {
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

    // Gerar token JWT
    const token = issueJWT(
      restaurant._id.toString(),
      restaurant.admin.email
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

export const getAllRestaurantsController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const restaurants = await getRestaurants();
    return res.status(200).json(restaurants);
  } catch (error) {
    console.error("Erro ao buscar restaurantes:", error);
    return res.status(500).json({ message: "Erro ao buscar restaurantes", error });
  }
};

export const getRestaurantByIdController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const restaurant = await getRestaurantById(id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurante não encontrado" });
    }

    res.json(restaurant);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao buscar restaurante", error });
  }
};

// No controlador
export const getRestaurantBySlugController = async (req: express.Request, res: express.Response) => {
  try {
    const { slug } = req.params;

    // Converter slug para nome (substituindo traços por espaços)
    const name = slug.replace(/-/g, ' ');

    // Buscar por nome (case insensitive)
    const restaurant = await RestaurantModel.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') }
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurante não encontrado" });
    }

    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar restaurante" });
  }
};

export const updateRestaurantController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    // Verificar se é o próprio restaurante que está tentando atualizar
    if (!req.isRestaurantAdmin || !req.restaurant) {
      return res.status(403).json({ message: "Apenas o próprio restaurante pode atualizar seus dados" });
    }

    const { id } = req.params;

    // Verificar se o ID corresponde ao ID do restaurante logado
    if (id !== req.restaurant._id.toString()) {
      return res.status(403).json({ message: "Você só pode atualizar seu próprio restaurante" });
    }

    const { name, cnpj, address, logo, specialty, phone, socialName, rating, admin, units, attendants } = req.body;

    // Verificar se o restaurante existe
    const existingRestaurant = await getRestaurantById(id);
    if (!existingRestaurant) {
      return res.status(404).json({ message: "Restaurante não encontrado" });
    }

    // Criar objeto com valores a serem atualizados
    const updateValues: Record<string, any> = {};

    if (name) updateValues.name = name;
    if (logo) updateValues.logo = logo;
    if (cnpj) updateValues.cnpj = cnpj;
    if (socialName) updateValues.socialName = socialName;
    if (address) updateValues.address = address;
    if (rating !== undefined) updateValues.rating = rating;
    if (specialty) updateValues.specialty = specialty;
    if (phone) updateValues.phone = phone;
    if (admin) updateValues.admin = admin;
    if (units) updateValues.units = units;
    if (attendants) updateValues.attendants = attendants;

    // Aplicar a atualização
    const updatedRestaurant = await updateRestaurant(id, updateValues);

    return res.status(200).json(updatedRestaurant || { message: "Restaurante atualizado com sucesso" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao atualizar restaurante", error });
  }
};

export const deleteRestaurantController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    // Verificar se é o próprio restaurante que está tentando excluir
    if (!req.isRestaurantAdmin || !req.restaurant) {
      return res.status(403).json({ message: "Apenas o próprio restaurante pode excluir sua conta" });
    }

    const { id } = req.params;

    // Verificar se o ID corresponde ao ID do restaurante logado
    if (id !== req.restaurant._id.toString()) {
      return res.status(403).json({ message: "Você só pode excluir seu próprio restaurante" });
    }

    const existingRestaurant = await getRestaurantById(id);
    if (!existingRestaurant) {
      return res.status(404).json({ message: "Restaurante não encontrado" });
    }

    const deletedRestaurant = await deleteRestaurant(id);

    return res.status(200).json({ message: "Restaurante excluído com sucesso", deletedRestaurant });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao excluir restaurante", error });
  }
};