import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from 'path';

import authRoutes from "./routes/authRoutes"
import createCustomer from "./routes/customerRoute"
import transaction from "./routes/transactionRoutes"
import customerRunningAccount from "./routes/customerRnningAccountRoutes"
import adminControlledRoutes from "./routes/adminControlledRoutes";
import customerAedBuyAndSell from "./routes/customerAedBuyAndSellRoutes";
import employeeActivity from "./routes/employeeRoutes";
import dashboardStats from "./routes/statsRoutes";
import notificationRoutes from "./routes/notification.routes";

dotenv.config();
export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.use("/api/auth", authRoutes)
app.use("/api", createCustomer)
app.use("/api", transaction)
app.use("/api", customerRunningAccount)
app.use("/api/admin", adminControlledRoutes)
app.use("/api", customerAedBuyAndSell)
app.use("/api", employeeActivity)
app.use("/api", dashboardStats)
app.use("/api", notificationRoutes)
// Basic test route
app.get("/api", (req: Request, res: Response) => {

  res.send({ message: "Percepta API is running ✅" });
});





app.get('/', (req: Request, res: Response) => {
  res.render('index', { title: 'Percepta Exchange', message: 'Welcome to Percepta API 🌟' });
});

app.get("/privacy-policy", (req: Request, res: Response) => {
  res.render("privacy-policy", {
    lastUpdated: "February 23, 2026",
    contactEmail: "muhammadshadabkhan67@gmail.com",
    companyName: "Perceptaa",
    address: "Islamabad, Pakistan"
  });
});