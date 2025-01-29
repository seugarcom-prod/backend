import { Request, Response } from "express";
import { createUser, getUserByEmail } from "../models/User";
import { random, authentication } from "../helpers";
import { cpf } from "cpf-cnpj-validator";
import { emailRegex } from "../utils/regex";

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

    // Gera um novo salt e cria um token de sessão
    const salt = random();
    const sessionToken = authentication(salt, user._id.toString());

    // Atualiza o token de sessão do usuário e salva no banco de dados
    user.authentication.sessionToken = sessionToken;
    await user.save();

    // Configura o cookie de sessão
    res.cookie("SESSION_TOKEN", sessionToken, {
      domain: "localhost",
      path: "/",
      httpOnly: true, // Protege o cookie contra acesso via JavaScript
      secure: process.env.NODE_ENV === "production", // Usa HTTPS em produção
    });

    // Retorna o usuário sem informações sensíveis
    const userResponse = JSON.parse(JSON.stringify(user));
    delete userResponse.authentication;
    return res.status(200).json(userResponse);
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};

export const GuestLogin = async (req: Request, res: Response) => {
  try {
    const { document, email } = req.body;

    // Validação dos campos obrigatórios
    if (!document || !email) {
      return res.status(400).json({ message: "CPF e email são obrigatórios." });
    }

    // Validação do CPF
    if (!cpf.isValid(document)) {
      return res.status(400).json({ message: "CPF inválido." });
    }

    // Validação básica do email
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email inválido." });
    }

    // Aqui você pode adicionar lógica para criar um usuário temporário (guest)
    // ou apenas retornar um token de sessão temporário.

    // Retorna uma resposta de sucesso
    return res.status(200).json({ message: "Login como convidado realizado com sucesso." });
  } catch (error) {
    console.error("Erro no GuestLogin:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, phone, password } = req.body;

    // Validação dos campos obrigatórios
    if (!email || !password || !firstName || !phone) {
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