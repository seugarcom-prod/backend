import mongoose from "mongoose";
import { IUser } from "./index";
const Schema = mongoose.Schema;

export interface IRestaurantUnit extends Document {
  address: string;
  cnpj: string;
  manager: string;
  contact: string;
  tables: Array<Number>;
  attendants: typeof mongoose.Schema.Types.ObjectId | IUser ;
};

const restaurantUnitSchema = new Schema({
  address: {
    type: String,
  },
  cnpj: {
    type: String,
  },
  manager: {
    type: String,
  },
  contact: {
    type: String,
  },
  tables: [
    {
      type: Number,
    },
  ],
  attendants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

// 3. Create a Model.
export const RestaurantUnitModel = mongoose.model<IRestaurantUnit>(
  "RestaurantUnit",
  restaurantUnitSchema
);

// METHODS

// Get All Restaurants
export const getRestaurantUnit = () => RestaurantUnitModel.find();

// Get Restaurant by Id
export const getRestaurantUnitById = (id: string) =>
  RestaurantUnitModel.findById(id);

// Create Restaurant
export const createRestaurantUnit = (values: Record<string, any>) =>
  new RestaurantUnitModel(values).save().then((user) => user.toObject());

// Delete Restaurant
export const deleteRestaurantUnit = (id: string) =>
  RestaurantUnitModel.findOneAndDelete({ _id: id });

// Update Restaurant
export const updateRestaurantUnit = (id: string, values: Record<string, any>) =>
  RestaurantUnitModel.findByIdAndUpdate(id, values);
