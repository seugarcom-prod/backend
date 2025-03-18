// routes/dashboardRoutes.ts
import express from "express";
import {
    getDashboardSummaryController,
    getRevenueReportController,
    getOrdersReportController,
    getTopProductsController,
    getDailyRevenueReportController
} from "../controllers/DashboardController";
import { isAuthenticated } from "../middlewares/index"; // Assumindo que você tem um middleware de autenticação

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas do dashboard
router.use(isAuthenticated);

// Rota para obter o resumo geral do dashboard
router.get('/summary/:unitId', getDashboardSummaryController);

// Rota para obter relatório de faturamento
router.get('/revenue/:unitId', getRevenueReportController);

// Rota para obter relatório de pedidos
router.get('/orders/:unitId', getOrdersReportController);

// Rota para obter os produtos mais vendidos
router.get('/top-products/:unitId', getTopProductsController);

// Rota para obter relatório de faturamento diário
router.get('/daily-revenue/:unitId', getDailyRevenueReportController);

export default router;