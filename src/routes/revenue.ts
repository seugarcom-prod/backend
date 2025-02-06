import express from "express";
import { getRevenue } from "../controllers/RevenueController";
import { isAuthenticated, hasRole } from "../middlewares";

const router = express.Router();

router.get("/:restaurantUnitId/revenue",
    hasRole('ADMIN'),
    isAuthenticated,
    getRevenue
);

export default router;