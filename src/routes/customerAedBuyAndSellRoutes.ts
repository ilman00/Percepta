import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import {
    createCustomerBuyOrSellTransaction,
    getCustomerBuyOrSellTransaction,
    editCustomerBuyOrSellTransaction, deleteCustomerBuyOrSellTransaction
} from "../controllers/customerAedBuyAndSellController";

const router = express.Router();

router.post("/aed-buy-sell", authenticate, createCustomerBuyOrSellTransaction);
router.get("/aed-buy-sell", authenticate, getCustomerBuyOrSellTransaction);
router.put("/aed-buy-sell/:id", authenticate, editCustomerBuyOrSellTransaction);
router.delete("/aed-buy-sell/:id", authenticate, deleteCustomerBuyOrSellTransaction);


export default router;