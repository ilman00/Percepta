import { Schema, model, Document, Types } from "mongoose";

export interface ITransaction extends Document {
  serial_no: number;
  customer: Types.ObjectId;

  transaction_type: "PKR_RUNNING" | "AED_BUY" | "AED_SELL";

  // PKR running account fields
  direction?: "to_company" | "to_customer"; // Only for PKR_RUNNING
  amount_pkr?: number;

  // AED exchange fields
  amount_aed?: number;
  exchange_rate?: number;

  // Profit for AED_SELL
  profit?: number;

  receipt_image?: string;
  description?: string;

  created_at: Date;
  updated_at: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    serial_no: { type: Number, required: true, unique: true },

    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },

    transaction_type: {
      type: String,
      enum: ["PKR_RUNNING", "AED_BUY", "AED_SELL"],
      required: true,
    },

    // PKR running account
    direction: {
      type: String,
      enum: ["to_company", "to_customer"],
      required: function () {
        return this.transaction_type === "PKR_RUNNING";
      },
    },

    amount_pkr: Number,

    // AED exchange
    amount_aed: Number,
    exchange_rate: Number,

    // Profit on AED_SELL
    profit: Number,

    // Optional receipt/image
    receipt_image: { type: String },

    description: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema
);
