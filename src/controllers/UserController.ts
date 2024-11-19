import express from "express";
import {
  getUsers,
  getUserById,
  deleteUser,
  getUserByEmail,
  getUserBySessionToken,
  updateUser,
  createUser,
  UserModel,
} from "../models/User.ts";
import { authentication, random } from "../helpers/index.ts";

export const createUserController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { email, firstName, lastName, phone, password } = req.body;

    if (!email || !password || !firstName || !phone) return res.sendStatus(400);

    const existingUser = await getUserByEmail(email);
    
    if (existingUser) res.sendStatus(400);

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
    });

    return res
      .status(200)
      .json({ msg: `${user.firstName} account has been created!` })
      .end()
      .send();
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ msg: "Could not create user! Please, check data." });
  }
};

export const getAllUsersController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const users = await getUsers();

    return res
    .sendStatus(200)
    .json(users);
  } catch (error) {
    console.log(error);
    return res
    .sendStatus(400);
  }
};

export const getUserByIdController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;

    UserModel.findById(id)
      .then((userFound) => {
        console.log(userFound);
        res
        .sendStatus(200)
        .json({ user: UserModel });
      })
      .catch((err) => console.log(err));
  } catch (error) {
    console.log(error);
    return res
    .status(500)
    .json({ message: "Something went wrong" });
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

    if (user) {
      user.firstName = firstName;
      user.lastName = lastName;
      user.phone = phone;
      user.email = email;
      if (user.authentication) user.authentication.password = password;

      await user.save();
    }

    return res
    .sendStatus(200)
    .json(user);
  } catch (error) {
    console.log(error);
    return res
    .status(500)
    .json({ message: "Something went wrong" });
  }
};

export const deleteUserController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;

    const deletedUser = await deleteUser(id);

    return res
    .json(deletedUser)
    .sendStatus(200);
  } catch (error) {
    console.log(error);
  }
};
