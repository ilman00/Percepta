import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authController"
import getAdmins from "./routes/adminApprovalRoute"

dotenv.config();
export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());


app.use("/api/auth", authRoutes)
app.use("/api",getAdmins)
// Basic test route
app.get("/",  (req: Request, res: Response) => {

  res.send({message:"Percepta API is running ✅"});
});