import { Router } from "express";
import {
  createOrderHandler,
  deleteOrderController,
  getRestaurantUnitOrdersController,
  getOrderByIdController,
  updateOrderController,
  requestTableCheckoutHandler,
  getTableOrdersController,
  processTablePaymentHandler
} from "../controllers/OrderController";
import { isAuthenticated, hasRole } from "../middlewares/index";

export default (orderRouter: Router) => {
  // Rota para criação de pedidos (aberta para convidados)
  orderRouter.post("/order/create", createOrderHandler);

  // Rota para usuários autenticados criarem pedidos
  orderRouter.post("/user/:id/order/create",
    isAuthenticated,
    createOrderHandler);

  // Rota para solicitar fechamento de conta (aberta para convidados)
  orderRouter.post("/order/request-checkout", requestTableCheckoutHandler);

  // Rota para processar pagamento (requer autenticação de staff)
  orderRouter.post("/order/process-payment", isAuthenticated, hasRole('MANAGER'), processTablePaymentHandler);

  // Listar pedidos de uma unidade (requer autenticação)
  orderRouter.get(
    "/unit/:restaurantUnitId/orders",
    isAuthenticated,
    getRestaurantUnitOrdersController
  );

  // Listar pedidos de uma mesa específica
  orderRouter.get(
    "/unit/:restaurantUnitId/table/:tableNumber/orders",
    getTableOrdersController
  );

  // Visualizar um pedido específico
  // Não requer autenticação, mas seria bom adicionar alguma validação
  // como um token temporário para convidados
  orderRouter.get("/order/:id", getOrderByIdController);

  // Atualizar pedido (requer autenticação)
  orderRouter.patch(
    "/order/:id/update",
    isAuthenticated,
    updateOrderController
  );

  // Excluir pedido (requer autenticação)
  orderRouter.delete(
    "/order/:id/delete",
    isAuthenticated,
    deleteOrderController
  );
};