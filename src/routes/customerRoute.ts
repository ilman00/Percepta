import express from "express";
import { createCustomer, getCustomers, updateCustomer, deleteCustomer } from "../controllers/customerController";
import { authenticate } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/create-customer", authenticate, createCustomer);
router.get("/customers/:currency_type", authenticate, getCustomers);
router.put("/customer/:customerId", authenticate, updateCustomer);
router.delete("/customer/:customerId", authenticate, deleteCustomer);


export default router;