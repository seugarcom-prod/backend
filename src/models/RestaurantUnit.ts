import mongoose from "mongoose";
import { IUser } from "./index";
const Schema = mongoose.Schema;

export interface IRestaurantUnit extends Document {
  name: string;
  address: {
    zipCode: string;
    street: string;
    number: number;
    complement: string
  };
  cnpj: string;
  socialName: string;
  manager: string;
  phone: string;
  attendants: mongoose.Types.ObjectId[]; // Corrigido para array de ObjectId
  orders: mongoose.Types.ObjectId[];
  restaurant: mongoose.Types.ObjectId; // Referência ao restaurante principal
  isActive: boolean;
};

const restaurantUnitSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    zipCode: {
      type: String,
      required: false,
    },
    street: {
      type: String,
      required: false
    },
    number: {
      type: Number,
      required: false
    },
    complement: {
      type: String,
    }
  },
  cnpj: {
    type: String,
  },
  socialName: {
    type: String
  },
  manager: {
    type: String,
  },
  phone: {
    type: String,
  },
  attendants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  orders: [
    {
      type: Schema.Types.ObjectId,
      ref: "Order"
    }
  ],
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Criar o modelo
export const RestaurantUnitModel = mongoose.model<IRestaurantUnit>(
  "RestaurantUnit",
  restaurantUnitSchema
);

// METHODS

// Get All Restaurant Units
export const getRestaurantUnits = () => RestaurantUnitModel.find();

// Get Restaurant Unit by Id
export const getRestaurantUnitById = (id: string) =>
  RestaurantUnitModel.findById(id);

// Get Restaurant Units by Restaurant Id
export const getRestaurantUnitsByRestaurant = (restaurantId: string) =>
  RestaurantUnitModel.find({ restaurant: restaurantId });

// Create Restaurant Unit
export const createRestaurantUnit = (values: Record<string, any>) =>
  new RestaurantUnitModel(values).save().then((unit) => unit.toObject());

// Delete Restaurant Unit
export const deleteRestaurantUnit = (id: string) =>
  RestaurantUnitModel.findOneAndDelete({ _id: id });

// Update Restaurant Unit
export const updateRestaurantUnit = (id: string, values: Record<string, any>) =>
  RestaurantUnitModel.findByIdAndUpdate(id, values, { new: true });