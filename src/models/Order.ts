import mongoose from "mongoose";
import { IRestaurant, IUser } from "./index";

const Schema = mongoose.Schema;

export interface IOrder extends Document {
  items: Array<{ name: string; quantity: number; description: string }>;
  isPaid: boolean;
  totalPrice: number;
  status: Array<string>;
  paidAt: Date;
  restaurant: typeof mongoose.Schema.Types.ObjectId | IRestaurant;
  customer: typeof mongoose.Schema.Types.ObjectId | IUser;
}

const orderSchema = new Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Foods"
      }
    ],
    status: {
      type: String,
      enum: ["Aguardando aprovação", "Ingredientes faltando", "Produzindo", "Pronto", "Entregue", "Cancelado"],
      default: "Aguardando aprovação",
    },
    attendant: {
      type: String,
    },
    table: {
      type: Number,
    },
    discountTicket: {
      type: String,
    },
    totalAmount: {
      type: Number,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model<IOrder>("Order", orderSchema);

// METHODS

// Get All User Requests by Id
export const getOrders = (id: string) => id && OrderModel.find();

// Get Request by Id for details
export const getOrderById = (id: string) => OrderModel.findById(id);

// Get Request by Date
export const getOrderByClientName = (name: string) =>
  OrderModel.findOne({ name });

// Create Request
export const createOrder = (values: Record<string, any>, userId: string) =>
  new OrderModel(values, userId).save().then((request) => request.toObject());

// Delete Request
export const deleteOrder = (id: string) =>
  OrderModel.findOneAndDelete({ _id: id });

// Update Request
export const updateOrder = (id: string, values: Record<string, any>) =>{
  OrderModel.findByIdAndUpdate(id, values);
}