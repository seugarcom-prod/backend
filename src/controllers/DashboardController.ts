// controllers/DashboardController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  getDashboardSummary,
  getRevenueReport,
  getOrdersReport,
  getTopProducts,
  getDailyRevenueReport
} from "../services/dashboard";
import { OrderModel } from "../models/Order";

// Interface para opções de filtro de data
interface DateFilterOptions {
  startDate?: Date;
  endDate?: Date;
  includeGuests?: boolean;
  limit?: number;
}

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

    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({
        message: "O parâmetro 'limit' deve ser um número positivo."
      });
    }

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

/**
 * Novo controlador para obter estatísticas de pedidos de convidados vs. usuários registrados
 */
export const getGuestVsUserStatsController = async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    const { startDate, endDate } = req.query;

    // Validação das datas se fornecidas
    let start: Date, end: Date;
    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          message: "Datas inválidas. Use o formato YYYY-MM-DD."
        });
      }
    } else {
      // Padrão: últimos 30 dias
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - 30);
    }

    // Obtém pedidos do período
    const filter: any = {
      restaurantUnit: new mongoose.Types.ObjectId(unitId),
      createdAt: { $gte: start, $lte: end }
    };

    const orders = await OrderModel.find(filter);

    // Contagem e faturamento por tipo de pedido
    const guestOrders = orders.filter(order => order.isGuest);
    const userOrders = orders.filter(order => !order.isGuest);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    const guestOrderCount = guestOrders.length;
    const userOrderCount = userOrders.length;

    const guestRevenue = guestOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const userRevenue = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Percentuais
    const guestOrderPercentage = totalOrders > 0 ? (guestOrderCount / totalOrders) * 100 : 0;
    const guestRevenuePercentage = totalRevenue > 0 ? (guestRevenue / totalRevenue) * 100 : 0;

    // Tendência mensal (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const mongoUnitId = new mongoose.Types.ObjectId(unitId);

    const monthlyTrend = await OrderModel.aggregate([
      {
        $match: {
          restaurantUnit: mongoUnitId,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            isGuest: "$isGuest"
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Formatar dados mensais
    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = getMonthName(date.getMonth());

      const monthData = {
        month: monthName,
        monthKey: monthStr,
        guestOrders: 0,
        userOrders: 0,
        guestRevenue: 0,
        userRevenue: 0
      };

      monthlyTrend.forEach(item => {
        if (item._id.year === date.getFullYear() && item._id.month === date.getMonth() + 1) {
          if (item._id.isGuest) {
            monthData.guestOrders = item.count;
            monthData.guestRevenue = Math.round(item.revenue * 100) / 100;
          } else {
            monthData.userOrders = item.count;
            monthData.userRevenue = Math.round(item.revenue * 100) / 100;
          }
        }
      });

      months.push(monthData);
    }

    // Retornar estatísticas
    return res.status(200).json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      totals: {
        orders: totalOrders,
        revenue: Math.round(totalRevenue * 100) / 100
      },
      guests: {
        orders: guestOrderCount,
        revenue: Math.round(guestRevenue * 100) / 100,
        orderPercentage: Math.round(guestOrderPercentage * 100) / 100,
        revenuePercentage: Math.round(guestRevenuePercentage * 100) / 100
      },
      users: {
        orders: userOrderCount,
        revenue: Math.round(userRevenue * 100) / 100,
        orderPercentage: Math.round((100 - guestOrderPercentage) * 100) / 100,
        revenuePercentage: Math.round((100 - guestRevenuePercentage) * 100) / 100
      },
      monthlyTrend: months
    });
  } catch (error: any) {
    console.error("Erro ao obter estatísticas de convidados vs usuários:", error);
    return res.status(500).json({
      message: error.message || "Erro interno no servidor."
    });
  }
};

/**
 * Função auxiliar para obter o nome do mês a partir do índice
 */
function getMonthName(monthIndex: number): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[monthIndex];
}