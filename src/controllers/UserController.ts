import express from "express";
import formidable from 'formidable';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  getUsers,
  getUserById,
  deleteUser,
  getUserByEmail,
  createUser,
  UserModel,
} from "../models/User.ts";
import { authentication, random } from "../helpers/index.ts";

const AVATAR_DIR = path.join(process.cwd(), 'public/avatars');

if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

export const createUserController = async (
  req: express.Request,
  res: express.Response
) => {
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('multipart/form-data')) {
    const form = formidable({
      uploadDir: AVATAR_DIR,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Erro no upload:', err);
        return res.status(500).json({ msg: 'Erro ao processar o upload' });
      }

      try {
        const email = fields.email?.[0];
        const firstName = fields.firstName?.[0];
        const lastName = fields.lastName?.[0];
        const phone = fields.phone?.[0];
        const password = fields.password?.[0];

        if (!email || !password || !firstName || !phone) {
          return res.status(400).json({ msg: 'Dados obrigatórios não fornecidos' });
        }

        const existingUser = await getUserByEmail(email);

        if (existingUser) {
          return res.status(400).json({ msg: 'Email já cadastrado' });
        }

        let avatarId = null;
        const avatarFile = files.avatar?.[0];

        if (avatarFile) {
          avatarId = uuidv4();
          const fileExt = path.extname(avatarFile.originalFilename || '');
          const newFileName = `${avatarId}${fileExt}`;
          const newPath = path.join(AVATAR_DIR, newFileName);

          fs.renameSync(avatarFile.filepath, newPath);
        }

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
          role: "CLIENT",
          avatar: avatarId,
        });

        return res.status(200).json({
          msg: `${user.firstName} account has been created!`,
          avatarUrl: avatarId ? `/avatars/${avatarId}${path.extname(avatarFile?.originalFilename || '')}` : null
        });
      } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return res.status(500).json({ msg: "Could not create user! Please, check data." });
      }
    });
  } else {
    try {
      const { email, firstName, lastName, phone, password, avatar } = req.body;

      if (!email || !password || !firstName || !phone) {
        return res.status(400).json({ msg: 'Missing required fields' });
      }

      const existingUser = await getUserByEmail(email);

      if (existingUser) {
        return res.status(400).json({ msg: 'Email already registered' });
      }

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
        role: "CLIENT",
        avatar: avatar || null,
      });

      return res
        .status(200)
        .json({ msg: `${user.firstName} account has been created!` });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ msg: "Could not create user! Please, check data." });
    }
  }
};

export const getAllUsersController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const users = await getUsers();
    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: "Error fetching users" });
  }
};

export const getUserByIdController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;

    const userFound = await UserModel.findById(id);
    if (!userFound) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.status(200).json({ user: userFound });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateUserController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, email, password } = req.body;

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.email = email || user.email;

    if (password && user.authentication) {
      const salt = random();
      user.authentication.salt = salt;
      user.authentication.password = authentication(salt, password);
    }

    await user.save();
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteUserController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const deletedUser = await deleteUser(id);

    if (!deletedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.status(200).json(deletedUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error deleting user" });
  }
};