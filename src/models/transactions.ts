import { Schema, model, Document, Types } from "mongoose";
import { Counter } from "./counter";

export interface ITransaction extends Document {
  serial_no: number;
  customer: Types.ObjectId;
  employee: Types.ObjectId;
  transaction_type: "PKR_RUNNING" | "AED_RUNNING";
  currency?: "PKR" | "AED";
  direction?: "to_company" | "to_customer";
  amount_pkr?: number;
  amount_aed?: number;
  exchange_rate?: number;
  profit?: number;
  receipt_image?: string;
  description?: string;

  status: "active" | "deleted";
  deleted_at?: Date;
  deleted_by?: Types.ObjectId;

  created_at: Date;
  updated_at: Date;
}


const transactionSchema = new Schema<ITransaction>(
  {
    serial_no: Number,

    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },

    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },

    transaction_type: {
      type: String,
      enum: ["PKR_RUNNING", "AED_RUNNING"],
      required: true,
    },

    currency: {
      type: String,
      enum: ["PKR", "AED"],
    },

    direction: {
      type: String,
      enum: ["to_company", "to_customer"],
      required: function () {
        return (
          this.transaction_type === "PKR_RUNNING" ||
          this.transaction_type === "AED_RUNNING"
        );
      },
    },

    amount_pkr: Number,
    amount_aed: Number,
    exchange_rate: Number,
    profit: Number,
    receipt_image: String,
    description: String,

    
    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
      index: true,
    },
    deleted_at: Date,
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);



// Auto-increment serial_no
transactionSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const counter = await Counter.findOneAndUpdate(
    { name: "transaction_serial" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  this.serial_no = counter.value;
  next();
});

export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema
);