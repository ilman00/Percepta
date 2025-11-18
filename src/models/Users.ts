import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "super_admin" | "admin";
  last_login?: Date;
  status: "approved" | "pending" | "inactive" | "deleted";
  total_money_sent_pkr: number;
  total_money_recieve_pkr: number;
  total_money_sell_AED: number;
  total_money_buy_AED: number;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["super_admin", "admin"], default: "admin" },
    last_login: { type: Date },
    status: { type: String, enum: ["approved", "pending", "inactive", "deleted"], default: "pending" },
    total_money_sent_pkr: { type: Number, default: 0 },
    total_money_recieve_pkr: { type: Number, default: 0 },
    total_money_sell_AED: { type: Number, default: 0 },
    total_money_buy_AED: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const User = model<IUser>("User", userSchema);
