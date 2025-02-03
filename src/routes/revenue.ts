import express from "express";
import { getRevenue } from "../controllers/RevenueController";

const router = express.Router();

router.get("/revenue/:restaurantUnitId", getRevenue);

export default router;