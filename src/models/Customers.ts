import { Schema, model, Document, Types } from "mongoose";
import { Counter } from "./counter";

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  description?: string;
  currency: "AED" | "PKR";
  employeeId: Types.ObjectId;
  serial_no: number;

  created_at: Date;
  updated_at: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    description: { type: String, trim: true },
    currency: { type: String, enum: ["AED", "PKR"], required: true },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    serial_no: Number
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

customerSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const counterName =
    this.currency === "AED"
      ? "customer_serial_aed"
      : "customer_serial_pkr";

  const counter = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  this.serial_no = counter.value;
  next();
});

export const Customer = model<ICustomer>("Customer", customerSchema);
