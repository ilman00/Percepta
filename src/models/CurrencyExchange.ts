import mongoose, { Schema, Document, model } from "mongoose";
import { Counter } from "./counter";

// 1. Define an interface for TypeScript
export interface ICurrencyExchange extends Document {
  employeeId: mongoose.Types.ObjectId;
  serial_no: number;
  customerName: string;
  customerPhone: string;
  type: "BUY" | "SELL";
  baseCurrency: string;
  quoteCurrency: string;
  aedAmount: number;
  rate: number;
  pkrAmount: number;
  expectedPkrAmount: number;

  status: "active" | "deleted";
  deleted_at?: Date;
  deleted_by?: mongoose.Types.ObjectId;

  createdAt: Date;
}


// 2. Define the schema
const CurrencyExchangeSchema: Schema<ICurrencyExchange> = new Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  serial_no: Number,

  customerName: {
    type: String,
    required: true,
    trim: true,
  },

  customerPhone: {
    type: String,
    trim: true,
  },

  type: {
    type: String,
    enum: ["BUY", "SELL"],
    required: true,
  },

  baseCurrency: {
    type: String,
    required: true,
    default: "AED",
  },

  quoteCurrency: {
    type: String,
    required: true,
    default: "PKR",
  },

  aedAmount: {
    type: Number,
    required: true,
    min: 0,
  },

  rate: {
    type: Number,
    required: true,
    min: 0,
  },

  pkrAmount: {
    type: Number,
    required: true,
    min: 0,
  },

  expectedPkrAmount: {
    type: Number,
    required: true,
    default: function () {
      return this.aedAmount * this.rate;
    },
  },

  // 🔴 Soft delete fields
  status: {
    type: String,
    enum: ["active", "deleted"],
    default: "active",
    index: true,
  },
  deleted_at: Date,
  deleted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});


// 3. Create the model


CurrencyExchangeSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "currencyExchange" }, // unique counter name for this collection
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    this.serial_no = counter!.value;
  }

  // recalc expectedPkrAmount just in case
  this.expectedPkrAmount = this.aedAmount * this.rate;

  next();
});

export const CurrencyExchange = model<ICurrencyExchange>("CurrencyExchange", CurrencyExchangeSchema);

