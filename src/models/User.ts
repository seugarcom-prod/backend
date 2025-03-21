import mongoose from "mongoose";
import validator from "validator";

const Schema = mongoose.Schema;

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string; // Campo avatar adicionado como opcional
  authentication: {
    password: string;
    salt: string;
    sessionToken: string;
  };
  role: "ADMIN" | "MANAGER" | "ATTENDANT" | "CLIENT";
}

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Please, provide a valid email."],
    },
    phone: {
      type: String,
      minLength: [11, "Please insert an valid phone number."],
      maxLength: [13, "Please insert an valid phone number."],
    },
    avatar: {
      type: String,
      default: null
    },
    authentication: {
      password: {
        type: String,
        select: false,
      },
      salt: { type: String, select: false },
      sessionToken: { type: String, select: false },
    },
    role: {
      type: String,
      enum: ["ADMIN", "ATTENDANT", "CLIENT"],
      default: 'CLIENT',
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model("User", userSchema);

// METHODS

// Get All Users
export const getUsers = () => UserModel.find();

// Get User by Id
export const getUserById = (id: string) => UserModel.findById(id);

// Get User by Email for Register Validation
export const getUserByEmail = (email: string) => {
  return UserModel.findOne({ email });
};

// Get User by SessionToken for Middleware
export const getUserBySessionToken = (sessionToken: string) => {
  return UserModel.findOne({
    'authentication.sessionToken': sessionToken,
  });
};

// Get User by Restaurant Unit
export const getUserByUnit = (unit: string) => {
  UserModel
    .find({ unit })
    .select("+authentication.sessionToken +role").find(getUsers);
}

// Create User
export const createUser = (values: Record<string, any>) =>
  new UserModel(values).save().then((user) => user.toObject());

// Delete User
export const deleteUser = (id: string) =>
  UserModel.findByIdAndDelete({ _id: id });

// Update User
export const updateUser = (id: string, values: Record<string, any>) =>
  UserModel.findByIdAndUpdate(id, values);