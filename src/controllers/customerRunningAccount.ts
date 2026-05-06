import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Transaction } from "../models/transactions";
import { Customer } from "../models/Customers";
import { User } from "../models/Users";


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
      return res.status(400).json({
        status: 400,
        message: "Customer ID is required.",
      });
    }

    if (!currency || !["PKR", "AED"].includes(currency)) {
      return res.status(400).json({
        status: 400,
        message: "Currency must be PKR or AED",
      });
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

    /* =============================
       ATTACH FILE URLS (LOCAL)
    ============================= */

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const data = transactions.map((tx: any) => {
      const obj = tx.toObject();

      return {
        ...obj,
        receipt_image_url: obj.receipt_image
          ? `${baseUrl}/uploads/${obj.receipt_image}`
          : null,
      };
    });

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    console.error("Get running account error:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error.",
    });
  }
};



export const searchTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { customerName, employeeName, serial_no } = req.query;

    const filter: any = {
      status: "active",
    };

    if (serial_no) {
      filter.serial_no = Number(serial_no);
    }
    
    /* =============================
       CUSTOMER FILTER
    ============================= */

    if (customerName) {
      const customers = await Customer.find({
        name: { $regex: customerName, $options: "i" },
      }).select("_id");

      filter.customer = { $in: customers.map((c) => c._id) };
    }

    /* =============================
       EMPLOYEE FILTER
    ============================= */

    if (employeeName) {
      const employees = await User.find({
        name: { $regex: employeeName, $options: "i" },
      }).select("_id");

      filter.employee = { $in: employees.map((e) => e._id) };
    }

    const transactions = await Transaction.find(filter)
      .populate("customer", "name")
      .populate("employee", "name")
      .sort({ created_at: -1 });

    /* =============================
       ATTACH FILE URLS (LOCAL)
    ============================= */

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const data = transactions.map((tx: any) => {
      const obj = tx.toObject();

      return {
        ...obj,
        receipt_image_url: obj.receipt_image
          ? `${baseUrl}/uploads/${obj.receipt_image}`
          : null,
      };
    });

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


