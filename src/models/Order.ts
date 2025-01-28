import mongoose, { Document, Schema } from "mongoose";
import { IRestaurant, IUser } from "./index"; // Certifique-se de que IRestaurant e IUser estão corretamente definidos
import { ProductModel } from "./Products";

export interface IOrder extends Document {
  restaurant: mongoose.Schema.Types.ObjectId | IRestaurant;
  customer: mongoose.Schema.Types.ObjectId | IUser;
  items: Array<{
    product: mongoose.Schema.Types.ObjectId;
    quantity: number;
    price: number;
  }>;
  table: number;
  isPaid: boolean;
  totalAmount: number;
  discountTicket?: string;
  status: string;
  paidAt?: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
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
      },
    ],
    table: {
      type: Number,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    discountTicket: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Aguardando aprovação", "Produzindo", "Pronto", "Entregue", "Cancelado"],
      default: "Aguardando aprovação",
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model<IOrder>("Order", orderSchema);

// Métodos

// Obter todos os pedidos
export const getOrders = () => OrderModel.find().populate("items.product");

// Obter pedido por ID
export const getOrderById = (id: string) => OrderModel.findById(id).populate("items.product");

// Criar pedido
export const createOrder = async (values: Record<string, any>) => {
  // Calcular o totalAmount com base nos itens do pedido
  const items = values.items;
  let totalAmount = 0;

  for (const item of items) {
    const product = await ProductModel.findById(item.product);
    if (!product || !product.isAvailable) {
      throw new Error(`Produto ${item.product} indisponível ou inválido`);
    }
    totalAmount += product.price * item.quantity;
    item.price = product.price; // Atualizar o preço no item do pedido
  }

  values.totalAmount = totalAmount;

  const order = new OrderModel(values);
  return order.save().then((order) => order.toObject());
};

// Deletar pedido
export const deleteOrder = (id: string) => OrderModel.findOneAndDelete({ _id: id });

// Atualizar pedido
export const updateOrder = (id: string, values: Record<string, any>) =>
  OrderModel.findByIdAndUpdate(id, values, { new: true }).populate("items.product");