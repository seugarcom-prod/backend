// controllers/dashboardController.ts
import { Request, Response } from "express";
import {
  getDashboardSummary,
  getRevenueReport,
  getOrdersReport,
  getTopProducts,
  getDailyRevenueReport
} from "../services/index";

/**
 * Controlador para obter o resumo do dashboard
 */
export const getDashboardSummaryController = async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;

    const summary = await getDashboardSummary(unitId);

    return res.status(200).json(summary);
  } catch (error: any) {
    console.error("Erro ao obter resumo do dashboard:", error);
    return res.status(500).json({
      message: error.message || "Erro interno no servidor."
    });
  }
};

/**
 * Controlador para obter relatório de faturamento
 */
export const getRevenueReportController = async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;

    const revenueReport = await getRevenueReport(unitId);

    return res.status(200).json(revenueReport);
  } catch (error: any) {
    console.error("Erro ao obter relatório de faturamento:", error);
    return res.status(500).json({
      message: error.message || "Erro interno no servidor."
    });
  }
};

/**
 * Controlador para obter relatório de pedidos
 */
export const getOrdersReportController = async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;

    const ordersReport = await getOrdersReport(unitId);

    return res.status(200).json(ordersReport);
  } catch (error: any) {
    console.error("Erro ao obter relatório de pedidos:", error);
    return res.status(500).json({
      message: error.message || "Erro interno no servidor."
    });
  }
};

/**
 * Controlador para obter os produtos mais vendidos
 */
export const getTopProductsController = async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

    const topProducts = await getTopProducts(unitId, limit);

    return res.status(200).json(topProducts);
  } catch (error: any) {
    console.error("Erro ao obter produtos mais vendidos:", error);
    return res.status(500).json({
      message: error.message || "Erro interno no servidor."
    });
  }
};

/**
 * Controlador para obter relatório de faturamento diário
 */
export const getDailyRevenueReportController = async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Parâmetros startDate e endDate são obrigatórios."
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Datas inválidas. Use o formato YYYY-MM-DD."
      });
    }

    const dailyReport = await getDailyRevenueReport(unitId, start, end);

    return res.status(200).json(dailyReport);
  } catch (error: any) {
    console.error("Erro ao obter relatório diário de faturamento:", error);
    return res.status(500).json({
      message: error.message || "Erro interno no servidor."
    });
  }
};
