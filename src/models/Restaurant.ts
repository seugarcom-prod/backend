import mongoose from "mongoose";
import { IRestaurantUnit, IUser } from "./index";
const Schema = mongoose.Schema;

export interface IRestaurant extends Document {
  name: string;
  logo: string;
  cnpj: string;
  socialName: string;
  address: {
    zipCode: string;
    street: string;
    number: number;
    complement: string
  };
  rating: number;
  specialty: string;
  phone: string;
  admin: {
    fullName: typeof mongoose.Schema.Types.String | IUser;
    cpf: typeof mongoose.Schema.Types.String | IUser;
  }
  units: typeof mongoose.Schema.Types.ObjectId | IRestaurantUnit;
  attendants: typeof mongoose.Schema.Types.ObjectId | IUser;
}

const restaurantSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      set: (v: string) => v.toLowerCase()
    },
    logo: {
      type: String,
    },
    cnpj: {
      type: String,
      required: true,
    },
    socialName: {
      type: String,
    },
    address: {
      zipCode: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true
      },
      number: {
        type: Number,
        required: true
      },
      complement: {
        type: String,
      }
    },
    rating: {
      type: Number,
    },
    specialty: {
      type: String,
    },
    phone: {
      type: String,
      required: true
    },
    admin: {
      fullName: {
        type: mongoose.Schema.Types.String,
        ref: "User"
      },
      cpf: {
        type: mongoose.Schema.Types.String,
        ref: "User"
      }
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

export const getRestaurantBySlug = (slug: string) => {
  const name = slug.replace(/-/g, ' ');
  return RestaurantModel.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') }
  });
};