import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { createTransaction, updateTransaction, deleteTransaction} from "../controllers/transactionController";
import { upload } from "../middlewares/upload";


const router = express.Router();

router.post("/transaction/:customerId", authenticate, upload.single("receipt_image"), createTransaction);
router.post("/update-transaction/:transactionId", authenticate, upload.single("receipt_image") , updateTransaction);
router.delete("/transaction/:transactionId", authenticate, deleteTransaction);

export default router;