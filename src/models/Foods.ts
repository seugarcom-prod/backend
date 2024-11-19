import mongoose from "mongoose";
import { IRestaurant } from "./index";

const Schema = mongoose.Schema;

export interface IFoods extends Document {
  restaurant: typeof mongoose.Schema.Types.ObjectId | IRestaurant;
  image: string;
  name: string;
  quantity: string;
  price: string;
  description: string;
}

export const foods = new Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
  },
  image: {
    type: String,
  },
  name: {
    type: String,
  },
  quantity: {
    type: Number,
  },
  price: {
    type: Number,
  },
  description: {
    type: String,
  },
});

const foodSchema = new Schema({
  foods: [foods],
});

export const foodModel = mongoose.model("Foods", foodSchema);

// METHODS

// Get All foods
export const getFoods = () => foodModel.find();

// Get food by Id
export const getFoodById = (id: string) => foodModel.findById(id);

// Get food by Email for Register Validation
export const getFoodByName = (name: string) => foodModel.findOne({ name });

// Create food
export const createFood = (values: Record<string, any>) =>
  new foodModel(values).save().then((food) => food.toObject());

// Delete food
export const deleteFood = (id: string) =>
  foodModel.findOneAndDelete({ _id: id });

// Update food
export const updateFood = (id: string, values: Record<string, any>) =>
  foodModel.findByIdAndUpdate(id, values);
