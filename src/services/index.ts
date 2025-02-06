import { OrderModel } from "../models/Order";
import mongoose from "mongoose";

interface RevenueReport {
    daily: number;
    weekly?: number;
    monthly?: number;
    yearly?: number;
}

export const getRevenueReport = async (
    restaurantUnitId: string
): Promise<RevenueReport> => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const matchStage = {
        $match: {
            restaurantUnit: new mongoose.Types.ObjectId(restaurantUnitId),
        },
    };

    const groupStage = {
        $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
        },
    };

    const dailyRevenue = await OrderModel.aggregate([
        matchStage,
        { $match: { createdAt: { $gte: startOfDay } } },
        groupStage,
    ]);

    const weeklyRevenue = await OrderModel.aggregate([
        matchStage,
        { $match: { createdAt: { $gte: startOfWeek } } },
        groupStage,
    ]);

    const monthlyRevenue = await OrderModel.aggregate([
        matchStage,
        { $match: { createdAt: { $gte: startOfMonth } } },
        groupStage,
    ]);

    const yearlyRevenue = await OrderModel.aggregate([
        matchStage,
        { $match: { createdAt: { $gte: startOfYear } } },
        groupStage,
    ]);

    return {
        daily: dailyRevenue[0]?.total || 0,
        weekly: weeklyRevenue[0]?.total || 0,
        monthly: monthlyRevenue[0]?.total || 0,
        yearly: yearlyRevenue[0]?.total || 0,
    };
};