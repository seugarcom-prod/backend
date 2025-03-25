import { Request, Response } from "express";
import { createUser, getUserByEmail } from "../models/User";
import { random, authentication } from "../helpers";

// LOGIN COMO USUÁRIO
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validação dos campos obrigatórios
    if (!email || !password) {
      return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    // Busca o usuário pelo email, incluindo o salt e a senha
    const user = await getUserByEmail(email).select(
      "+authentication.salt +authentication.password"
    );

    // Verifica se o usuário existe
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Verifica se o usuário tem autenticação configurada
    if (!user.authentication || !user.authentication.salt) {
      return res.status(500).json({ message: "Erro na configuração do usuário." });
    }

    // CORREÇÃO: Verificar se a senha está correta
    const expectedHash = authentication(user.authentication.salt, password);
    if (expectedHash !== user.authentication.password) {
      return res.status(403).json({ message: "Senha incorreta." });
    }

    // Gera um novo salt para o token de sessão (diferente do salt da senha)
    const salt = random();
    const sessionToken = authentication(salt, user._id.toString());

    // Atualiza o token de sessão do usuário e salva no banco de dados
    user.authentication.sessionToken = sessionToken;
    await user.save();

    // Redireciona com base na role do usuário
    let redirectRoute = "";
    switch (user.role) {
      case "ADMIN":
        redirectRoute = "/admin";
        break;
      case "ATTENDANT":
        redirectRoute = "/unit";
        break;
      case "CLIENT":
        // redirectRoute = "/restaurant/order";
        redirectRoute = "/admin";
        break;
      default:
        // redirectRoute = "/restaurant/order";
        redirectRoute = "/admin";
    }

    // Retorna a rota de redirecionamento e o token de sessão
    return res.status(200).json({
      redirectRoute,
      sessionToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};

// LOGIN COMO CONVIDADO
export const guestLogin = async (req: Request, res: Response) => {
  try {
    const sessionToken = authentication(random(), "GUEST");

    return res.status(200).json({
      redirectRoute: "/admin",
      sessionToken,
    });
  } catch (error) {
    console.error("Erro no login de convidado:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};

// CADASTRO DE USUÁRIO
export const register = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, phone, cpf, password, role } = req.body;

    // Validação dos campos obrigatórios
    if (!email || !password || !firstName || !phone || !cpf) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    // Verifica se o usuário já existe
    const existingUser = await getUserByEmail(email).lean();
    if (existingUser) {
      return res.status(400).json({ message: "Email já cadastrado." });
    }

    // Cria o usuário com uma senha segura
    const salt = random();
    const user = await createUser({
      firstName,
      lastName,
      email,
      phone,
      cpf,
      role,
      authentication: {
        salt,
        password: authentication(salt, password),
      },
    });

    // Retorna o usuário sem informações sensíveis
    const userResponse = { ...user };
    delete userResponse.authentication;
    return res.status(201).json(userResponse);
  } catch (error) {
    console.error("Erro no registro:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};

export const logout = (req: Request, res: Response) => {
  try {
    // Remove o cookie de sessão
    res.clearCookie("SESSION_TOKEN", {
      domain: "localhost",
      path: "/",
    });

    return res.status(200).json({ message: "Logout realizado com sucesso." });
  } catch (error) {
    console.error("Erro no logout:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};