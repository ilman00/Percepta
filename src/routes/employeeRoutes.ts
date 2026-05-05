import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import {getEmployeeActivity, softDeleteEmployee, updateEmployee } from "../controllers/employeeController";

const router = express.Router();

router.get("/employee-activity", authenticate, getEmployeeActivity);
router.delete("/employee/:userId", authenticate, softDeleteEmployee);
router.put("/employee/:userId", authenticate, updateEmployee);

export default router;