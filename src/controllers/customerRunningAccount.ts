import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Transaction } from "../models/transactions";
import { Customer } from "../models/Customers";
import { User } from "../models/Users";
import { getSignedUrlForFile } from "../config/s3";


export const getCustomerRunningAccount = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const customerParam = req.params.customerId;
    const currencyParam = req.params.currency;

    if (Array.isArray(customerParam) || Array.isArray(currencyParam)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid parameters",
      });
    }

    const customerId = customerParam;
    const currency = currencyParam;

    if (!customerId) {
      return res
        .status(400)
        .json({ status: 400, message: "Customer ID is required." });
    }

    if (!currency || !["PKR", "AED"].includes(currency)) {
      return res
        .status(400)
        .json({ status: 400, message: "Currency must be PKR or AED" });
    }

    const transactionType =
      currency === "PKR" ? "PKR_RUNNING" : "AED_RUNNING";

    const transactions = await Transaction.find({
      customer: customerId,
      transaction_type: transactionType,
      status: "active",
    })
      .populate("employee", "name")
      .populate("customer", "name")
      .sort({ serial_no: -1 });

    // 🔑 Attach signed URLs
    const data = await Promise.all(
      transactions.map(async (tx) => {
        const obj = tx.toObject();

        let receipt_image_url = null;

        if (obj.receipt_image) {
          receipt_image_url = await getSignedUrlForFile(
            obj.receipt_image,
            60 * 10 // 10 minutes
          );
        }

        return {
          ...obj,
          receipt_image_url, // 👈 frontend will use this
        };
      })
    );

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Get running account error:", error);
    return res
      .status(500)
      .json({ status: 500, message: "Internal server error." });
  }
};

export const searchTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { customerName, employeeName, serial_no } = req.query;

    // 🚫 Always exclude deleted transactions
    const filter: any = {
      status: "active",
    };

    // 🔢 Serial number filter
    if (serial_no) {
      filter.serial_no = Number(serial_no);
    }

    // 👤 Customer name filter
    if (customerName) {
      const customers = await Customer.find({
        name: { $regex: customerName, $options: "i" },
      }).select("_id");

      filter.customer = { $in: customers.map(c => c._id) };
    }

    // 🧑 Employee name filter
    if (employeeName) {
      const employees = await User.find({
        name: { $regex: employeeName, $options: "i" },
      }).select("_id");

      filter.employee = { $in: employees.map(e => e._id) };
    }

    const transactions = await Transaction.find(filter)
      .populate("customer", "name")
      .populate("employee", "name")
      .sort({ created_at: -1 });

    // 🔑 Attach signed URLs for receipt images
    const data = await Promise.all(
      transactions.map(async (tx) => {
        const obj = tx.toObject();

        let receipt_image_url = null;

        if (obj.receipt_image) {
          receipt_image_url = await getSignedUrlForFile(
            obj.receipt_image,
            60 * 10 // 10 minutes
          );
        }


        return {
          ...obj,
          receipt_image_url,
        };
      })
    );

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Search transactions error:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};


