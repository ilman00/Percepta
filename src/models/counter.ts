// models/counter.ts
import { Schema, model } from "mongoose";

const counterSchema = new Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

export const Counter = model("Counter", counterSchema);
