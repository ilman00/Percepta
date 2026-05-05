import express from "express"
import { authenticate } from "../middlewares/authMiddleware";
import { getCustomerRunningAccount, searchTransactions } from "../controllers/customerRunningAccount";

const router = express.Router();

router.get("/running/:customerId/:currency", authenticate, getCustomerRunningAccount);
router.get("/transactions/search", authenticate, searchTransactions);

export default router;