import express from "express";
import { validationResult } from "express-validator";
import {
  createOrder,
  deleteOrder,
  getOrders,
  getOrderById,
  getOrderByClientName,
  updateOrder,
} from "../models/Order.ts";

export const createOrderController = async (
  req: express.Request,
  res: express.Response
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: "error", errors: errors.array() });
  }

  const { id } = req.params;
  const userId = id;

  try {
    const { customerName, items, attendant, table, totalAmount, discountTicket, isPaid } = req.body;
    const newRequest = await createOrder(
      { customerName, items, attendant, table, totalAmount, discountTicket, isPaid },
      userId
    );

    res.status(201).json({ msg: `Order created: ${newRequest}` });
  } catch (error) {
    console.log("Error", error);
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
    } else if (items) {
      // Caso o pedido tenha itens atualizados
      userRequest.items = [...userRequest.items, ...items]; // Adicionar itens ao pedido existente
      userRequest.totalPrice = (userRequest.totalPrice || 0) + totalAmount;
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
  const { id } = req.params;

  try {
    const orders = await getOrders(id);

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
    const { id } = req.params;
    const userRequest = await getOrderById(id);

    if (!userRequest) {
      return res.status(404).json({ message: "Request does not exist" });
    }

    res.status(200).json(userRequest);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getOrderByClientNameController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { user } = req.params;
    const userRequest = await getOrderByClientName(user);

    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    if (!userRequest) {
      return res.status(404).json({ message: "Request does not exist" });
    }

    res.status(200).json(userRequest);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteOrderController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;

    const deletedRequest = await deleteOrder(id);

    return res.json(deletedRequest);
  } catch (error) {
    console.log(error);
  }
};
