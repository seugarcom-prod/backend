import express from "express";
import { validationResult } from "express-validator";
import {
  createOrder,
  deleteOrder,
  getOrders,
  getOrderById,
  updateOrder,
} from "../models/Order.ts";
import { ProductModel } from "../models/Products.ts";

export const createOrderController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { restaurant, customer, items, table, discountTicket } = req.body;

    const order = await createOrder({
      restaurant,
      customer,
      items,
      table,
      discountTicket,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateOrderController = async (
  req: express.Request,
  res: express.Response
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

export const getAllOrdersController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const orders = await getOrders();

    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const getOrderByIdController = async (
  req: express.Request,
  res: express.Response
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

export const deleteOrderController = async (
  req: express.Request,
  res: express.Response
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
