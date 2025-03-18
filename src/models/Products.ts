import mongoose, { Document, Schema } from "mongoose";
import { IRestaurant } from "./index"; // Certifique-se de que IRestaurant está corretamente definido

export interface IProduct extends Document {
  restaurant: mongoose.Schema.Types.ObjectId | IRestaurant;
  category: string;
  image: string;
  name: string;
  quantity: number;
  price: number;
  description: string;
  isAvailable: boolean;
}

const productSchema = new Schema<IProduct>({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  category: {
    type: String,
  },
  image: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
  },
});

export const ProductModel = mongoose.model<IProduct>("Product", productSchema);

// Métodos

// Obter todos os produtos
export const getProducts = () => ProductModel.find();

// Obter produto por ID
export const getProductById = (id: string) => ProductModel.findById(id);

// Obter produto por nome (para validação de registro)
export const getProductByName = (name: string) => ProductModel.findOne({ name });

// Criar produto
export const createProduct = (values: Record<string, any>) =>
  new ProductModel(values).save().then((product) => product.toObject());

// Deletar produto
export const deleteProduct = (id: string) =>
  ProductModel.findOneAndDelete({ _id: id });

// Atualizar produto
export const updateProduct = (id: string, values: Record<string, any>) =>
  ProductModel.findByIdAndUpdate(id, values, { new: true });