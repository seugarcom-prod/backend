import mongoose from "mongoose";
import { IRestaurantUnit, IUser } from "./index";
const Schema = mongoose.Schema;

export interface IRestaurant extends Document {
  name: string;
  logo: string;
  cnpj: string;
  address: string;
  rating: number;
  units: typeof mongoose.Schema.Types.ObjectId | IRestaurantUnit;
  attendants: typeof mongoose.Schema.Types.ObjectId | IUser;
}

const restaurantSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    cnpj: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
    },
    units: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RestaurantUnit",
      },
    ],
    attendants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ]
  },
  { timestamps: true }
);

export const RestaurantModel = mongoose.model<IRestaurant>("Restaurant", restaurantSchema);

// METHODS

// Get All Restaurants
export const getRestaurants = () => RestaurantModel.find();

// Get Restaurant by Id
export const getRestaurantById = (id: string) => RestaurantModel.findById(id);

// Get Restaurant by Name (also for register validation)
export const getRestaurantByName = (name: string) =>
  RestaurantModel.findOne({ name });

// Create Restaurant
export const createRestaurant = (values: Record<string, any>) =>
  new RestaurantModel(values).save().then((restaurant) => restaurant.toObject());

// Delete Restaurant
export const deleteRestaurant = (id: string) =>
  RestaurantModel.findOneAndDelete({ _id: id });

// Update Restaurant
export const updateRestaurant = (id: string, values: Record<string, any>) =>
  RestaurantModel.findByIdAndUpdate(id, values);
