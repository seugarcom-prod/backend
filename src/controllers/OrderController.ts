import { Request, Response } from "express";
import { OrderModel } from "../models/Order";
import { UserModel } from "../models/User";
import { RestaurantUnitModel } from "../models/RestaurantUnit";

// Controlador para criar pedidos
export const createOrderHandler = async (req: Request, res: Response) => {
  const {
    userId,
    restaurantUnitId,
    items,
    totalAmount,
    guestInfo,
    tableNumber,
    observations,
    orderType,
    splitCount // Novo campo para divisão de conta
  } = req.body;

  try {
    // Criar o objeto base do pedido
    const orderData: any = {
      restaurantUnit: restaurantUnitId,
      items,
      totalAmount,
      metadata: {
        observations,
        orderType,
        tableNumber,
        splitCount: splitCount || 1 // Valor padrão é 1 (sem divisão)
      }
    };

    // Se for um usuário registrado, use o ID do usuário
    if (userId) {
      orderData.user = userId;
    }
    // Se for um convidado, salve suas informações
    else if (guestInfo) {
      orderData.guestInfo = guestInfo; // email, nome, telefone
      orderData.isGuest = true;
    } else {
      return res.status(400).json({
        message: "É necessário fornecer ID de usuário ou informações de convidado"
      });
    }

    // 1. Criar o pedido
    const order = new OrderModel(orderData);
    await order.save();

    // 2. Se for usuário registrado, atualizar o documento do User
    if (userId) {
      await UserModel.findByIdAndUpdate(
        userId,
        {
          $push: {
            orders: order._id
          }
        },
        { new: true }
      );
    }

    // 3. Atualizar o documento do RestaurantUnit
    await RestaurantUnitModel.findByIdAndUpdate(
      restaurantUnitId,
      {
        $push: {
          orders: order._id
        }
      },
      { new: true }
    );

    // Aqui seria o lugar para enviar uma notificação ao restaurante
    // sobre o novo pedido (via WebSockets, push notification, etc.)

    res.status(201).json(order);
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    res.status(500).json({ message: "Erro ao criar pedido", error });
  }
};

// Controlador para solicitar fechamento de conta de uma mesa
export const requestTableCheckoutHandler = async (req: Request, res: Response) => {
  const { restaurantUnitId, tableNumber, splitCount } = req.body;

  try {
    if (!restaurantUnitId || !tableNumber) {
      return res.status(400).json({
        message: "É necessário fornecer o ID da unidade e o número da mesa"
      });
    }

    // 1. Encontrar todos os pedidos ativos da mesa
    const activeOrders = await OrderModel.find({
      restaurantUnit: restaurantUnitId,
      'metadata.tableNumber': tableNumber,
      status: { $nin: ['completed', 'cancelled'] },
      isPaid: false
    });

    if (activeOrders.length === 0) {
      return res.status(404).json({
        message: "Não foram encontrados pedidos ativos para esta mesa"
      });
    }

    // 2. Atualizar todos os pedidos para status "payment_requested"
    const orderIds = activeOrders.map(order => order._id);

    await OrderModel.updateMany(
      { _id: { $in: orderIds } },
      {
        $set: {
          status: 'payment_requested',
          'metadata.paymentRequestedAt': new Date(),
          'metadata.splitCount': splitCount || 1 // Atualizar com informação de divisão
        }
      }
    );

    // 3. Atualizar o documento da unidade com informação de mesa solicitando pagamento
    await RestaurantUnitModel.findByIdAndUpdate(
      restaurantUnitId,
      {
        $addToSet: {
          tablesRequestingCheckout: tableNumber
        }
      },
      { new: true }
    );

    // Aqui seria o lugar para enviar uma notificação ao restaurante
    // sobre o pedido de fechamento de conta (via WebSockets, push notification, etc.)

    res.status(200).json({
      message: "Solicitação de fechamento de conta enviada com sucesso",
      ordersUpdated: orderIds.length,
      splitCount: splitCount || 1
    });
  } catch (error) {
    console.error("Erro ao solicitar fechamento de conta:", error);
    res.status(500).json({
      message: "Erro ao solicitar fechamento de conta",
      error
    });
  }
};

// Controlador para processar o pagamento de uma mesa
export const processTablePaymentHandler = async (req: Request, res: Response) => {
  const { restaurantUnitId, tableNumber, paymentMethod, staffId, splitCount } = req.body;

  try {
    if (!restaurantUnitId || !tableNumber) {
      return res.status(400).json({
        message: "É necessário fornecer o ID da unidade e o número da mesa"
      });
    }

    // 1. Encontrar todos os pedidos pendentes da mesa
    const pendingOrders = await OrderModel.find({
      restaurantUnit: restaurantUnitId,
      'metadata.tableNumber': tableNumber,
      isPaid: false,
      status: { $nin: ['cancelled'] }
    });

    if (pendingOrders.length === 0) {
      return res.status(404).json({
        message: "Não foram encontrados pedidos pendentes para esta mesa"
      });
    }

    // 2. Atualizar todos os pedidos para pagos
    const orderIds = pendingOrders.map(order => order._id);
    const now = new Date();

    await OrderModel.updateMany(
      { _id: { $in: orderIds } },
      {
        $set: {
          status: 'completed',
          isPaid: true,
          paidAt: now,
          'metadata.paymentMethod': paymentMethod,
          'metadata.processedBy': staffId,
          'metadata.splitCount': splitCount || 1 // Garantir que a informação de divisão seja armazenada
        }
      }
    );

    // 3. Remover a mesa da lista de mesas solicitando pagamento
    await RestaurantUnitModel.findByIdAndUpdate(
      restaurantUnitId,
      {
        $pull: {
          tablesRequestingCheckout: tableNumber
        }
      },
      { new: true }
    );

    // Calcular o total e valor por pessoa
    const total = pendingOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const finalSplitCount = splitCount || 1;
    const amountPerPerson = finalSplitCount > 1 ? total / finalSplitCount : total;

    res.status(200).json({
      message: "Pagamento processado com sucesso",
      ordersProcessed: orderIds.length,
      total,
      splitCount: finalSplitCount,
      amountPerPerson,
      processedAt: now
    });
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    res.status(500).json({
      message: "Erro ao processar pagamento",
      error
    });
  }
};

// Controlador para obter pedidos de uma unidade
export const getRestaurantUnitOrdersController = async (req: Request, res: Response) => {
  try {
    const { restaurantUnitId } = req.params;
    const { status } = req.query;

    const filter: any = { restaurantUnit: restaurantUnitId };

    // Se status foi especificado, adicionar ao filtro
    if (status) {
      filter.status = status;
    }

    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email');

    res.json(orders);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    res.status(500).json({ message: "Erro ao buscar pedidos", error });
  }
};

// Controlador para obter um pedido específico
export const getOrderByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.findById(id)
      .populate('user', 'firstName lastName email')
      .populate('restaurantUnit', 'name address');

    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    res.json(order);
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    res.status(500).json({ message: "Erro ao buscar pedido", error });
  }
};

// Controlador para atualizar um pedido
export const updateOrderController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    res.status(500).json({ message: "Erro ao atualizar pedido", error });
  }
};

// Controlador para excluir um pedido
export const deleteOrderController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedOrder = await OrderModel.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    // Remover referência do pedido da unidade
    await RestaurantUnitModel.findByIdAndUpdate(
      deletedOrder.restaurantUnit,
      {
        $pull: {
          orders: id
        }
      }
    );

    // Se o pedido estiver associado a um usuário, remover a referência
    if (deletedOrder.user) {
      await UserModel.findByIdAndUpdate(
        deletedOrder.user,
        {
          $pull: {
            orders: id
          }
        }
      );
    }

    res.json({ message: "Pedido excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir pedido:", error);
    res.status(500).json({ message: "Erro ao excluir pedido", error });
  }
};

// Controlador para obter pedidos de uma mesa específica
export const getTableOrdersController = async (req: Request, res: Response) => {
  try {
    const { restaurantUnitId, tableNumber } = req.params;

    const orders = await OrderModel.find({
      restaurantUnit: restaurantUnitId,
      'metadata.tableNumber': parseInt(tableNumber),
      status: { $nin: ['cancelled'] }
    }).sort({ createdAt: -1 });

    // Agrupar itens e calcular total
    const allItems = orders.flatMap(order => order.items);
    const total = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Verificar se algum pedido está com pagamento solicitado
    const paymentRequested = orders.some(order => order.status === 'payment_requested');

    // Verificar se todos os pedidos estão pagos
    const allPaid = orders.length > 0 && orders.every(order => order.isPaid);

    // Obter informação sobre divisão de conta (do pedido mais recente)
    const lastOrder = orders.length > 0 ? orders[0] : null;
    const splitCount = lastOrder?.metadata?.splitCount || 1;
    const amountPerPerson = splitCount > 1 ? total / splitCount : total;

    res.json({
      orders,
      summary: {
        total,
        itemCount: allItems.length,
        orderCount: orders.length,
        paymentRequested,
        allPaid,
        splitCount,
        amountPerPerson
      }
    });
  } catch (error) {
    console.error("Erro ao buscar pedidos da mesa:", error);
    res.status(500).json({ message: "Erro ao buscar pedidos da mesa", error });
  }
};