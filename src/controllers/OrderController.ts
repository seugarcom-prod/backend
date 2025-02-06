import express from "express";
import { Request, Response } from "express";
import {
  getOrders,
  getOrderById,
  updateOrder,
  OrderModel,
} from "../models/Order.ts";
import { RestaurantUnitModel } from "../models/RestaurantUnit.ts";
import { UserModel } from "../models/User.ts";

export const createOrderHandler = async (req: Request, res: Response) => {
  const { userId, restaurantUnitId, items, totalAmount } = req.body;

  try {
    // 1. Criar o pedido
    const order = new OrderModel({
      user: userId,
      restaurantUnit: restaurantUnitId,
      items,
      totalAmount,
    });

    await order.save();

    // 2. Atualizar o documento do User
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          orders: order._id
        }
      }, // Adiciona o ID do pedido à lista de pedidos do usuário
      { new: true }
    );

    // 3. Atualizar o documento do RestaurantUnit
    await RestaurantUnitModel.findByIdAndUpdate(
      restaurantUnitId,
      {
        $push: {
          orders: order._id
        }
      }, // Adiciona o ID do pedido à lista de pedidos da unidade
      { new: true }
    );

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar pedido", error });
  }
};

export const updateOrderController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { items, totalAmount, isPaid } = req.body;

    const userRequest = await getOrderById(id);

    if (!userRequest) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    if (isPaid) {
      // Caso o pedido seja finalizado/pago
      userRequest.isPaid = true;
      userRequest.paidAt = new Date();
      userRequest.save();
    } else if (items) {
      // Caso o pedido tenha itens atualizados
      userRequest.items = [...userRequest.items, ...items]; // Adicionar itens ao pedido existente
      userRequest.totalAmount = (userRequest.totalAmount || 0) + totalAmount;
    }

    // Atualizar o pedido no banco
    await updateOrder(id, userRequest);

    return res.status(200).json(userRequest);
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({ message: "Erro ao atualizar o pedido." });
  }
};


export const getOrderByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar pedido", error });
  }
};

export const getRestaurantUnitOrdersController = async (req: Request, res: Response) => {
  const { restaurantUnitId } = req.params;

  try {
    const restaurantUnit = await RestaurantUnitModel.findById(restaurantUnitId).populate({
      path: "orders",
      populate: {
        path: "user",
        select: "name email"
      },
    });

    if (!restaurantUnit) {
      return res.status(404).json({ message: "Unidade de restaurante não encontrada" });
    }

    res.json(restaurantUnit.orders);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar pedidos da unidade", error });
  }
};

export const deleteOrderController = async (
  req: Request,
  res: Response
) => {
  try {
    const { status, isPaid } = req.body;
    const order = await updateOrder(req.params.id, { status, isPaid });
    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar pedido", error });
  }
};
