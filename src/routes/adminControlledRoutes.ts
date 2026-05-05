import express from "express";
import { activateEmployee, deactivateEmployee, getDeletedTransactionsAdmin, getDeletedCustomerBuySellAdmin } from "../controllers/adminController";
import { authenticate } from "../middlewares/authMiddleware";
import { employeeList } from "../controllers/adminController";
const router = express.Router();

router.get("/employees", authenticate, employeeList)
router.patch("/employee/activate/:employeeId", authenticate, activateEmployee);
router.patch("/employee/deactivate/:employeeId", authenticate, deactivateEmployee);
router.get("/deleted-transactions", authenticate, getDeletedTransactionsAdmin);
router.get("/deleted-customer-buy-sell", authenticate, getDeletedCustomerBuySellAdmin);

export default router;   