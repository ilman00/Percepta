import { Request, Response } from "express";
import { Transaction } from "../models/transactions";
import { AuthRequest } from "../middlewares/authMiddleware";
import { User } from "../models/Users";
import { sendPushNotificationToMany } from "../service/notification.service";
import fs from "fs";
import path from "path";
import { uploadPath } from "../config/stoage";



export const createTransaction = async (req: Request, res: Response) => {
  let uploadedFilePath: string | null = null;

  try {
    const customerId = req.params.customerId;
    const employeeId = (req as any).user.userId;

    const {
      transaction_type,
      currency,
      direction,
      amount_pkr,
      amount_aed,
      exchange_rate,
      description,
    } = req.body;

    const employee = await User.findById(employeeId).select("name");
    const employeeName = employee?.name || "Unknown";

    /* =============================
      FILE HANDLING
    ============================= */

    const file = req.file as Express.Multer.File | undefined;

    if (file) {
      uploadedFilePath = path.join(uploadPath, file.filename);
    }

    console.log("Received file:", file ? file.filename : "No file uploaded");

    const receipt_image = file ? file.filename : undefined;

    /* =============================
      VALIDATION
    ============================= */

    const validTypes = ["PKR_RUNNING", "AED_RUNNING"];

    if (!validTypes.includes(transaction_type)) {
      return res.status(400).json({ error: "Invalid transaction type" });
    }

    if (!direction) {
      return res.status(400).json({ error: "Direction is required" });
    }

    if (!currency || !["PKR", "AED"].includes(currency)) {
      return res.status(400).json({ error: "Invalid currency" });
    }

    if (!amount_pkr && !amount_aed) {
      return res.status(400).json({ error: "Amount is required" });
    }

    /* =============================
      CREATE TRANSACTION
    ============================= */

    const transaction = await Transaction.create({
      customer: customerId,
      employee: employeeId,
      transaction_type,
      currency,
      direction,
      amount_pkr,
      amount_aed,
      exchange_rate,
      description,
      receipt_image,
    });

    /* =============================
      BACKGROUND NOTIFICATION
    ============================= */

    let directionText = "";

    if (direction === "to_company") {
      directionText = "Recieved";
    } else if (direction === "to_customer") {
      directionText = "Send";
    }


    (async () => {
      try {
        const users = await User.find({
          status: "active",
          fcmTokens: { $exists: true, $ne: [] },
        }).select("fcmTokens");

        const tokens = users.flatMap((u) => u.fcmTokens || []);

        if (!tokens.length) return;
        console.log( "Employee:", employeeName, "Direction:", directionText, "Transaction Type:", transaction_type, "currency:", currency, "amount_pkr:", amount_pkr, "amount_aed:", amount_aed);
        const amount =
          currency === "PKR"
            ? `${amount_pkr || 0} PKR`
            : `${amount_aed || 0} AED`;

        const title = "New Customer Transaction";
        const body = `${employeeName} ${directionText} ${amount} (${transaction_type})`;

        await sendPushNotificationToMany(tokens, title, body);
      } catch (error) {
        console.error("Notification background error:", error);
      }
    })();

    /* =============================
      RESPONSE
    ============================= */

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const transactionWithUrl = {
      ...transaction.toObject(),
      receipt_image: receipt_image
        ? `${baseUrl}/uploads/${receipt_image}`
        : null,
    };

    return res.status(201).json({
      message: "Transaction created successfully",
      transaction: transactionWithUrl,
    });
  } catch (error) {
    console.error("Create Transaction Error:", error);

    /* =============================
      CLEANUP (VERY IMPORTANT)
    ============================= */

    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
        console.log("Cleaned up uploaded file after failure");
      } catch (cleanupError) {
        console.error("File cleanup error:", cleanupError);
      }
    }

    return res.status(500).json({
      error: "Server error",
    });
  }
};



export const updateTransaction = async (req: Request, res: Response) => {
  let newUploadedFilePath: string | null = null;

  try {
    const { transactionId } = req.params;

    const {
      currency,
      direction,
      amount_pkr,
      amount_aed,
      description,
    } = req.body;

    /* =============================
       FILE HANDLING
    ============================= */

    const file = req.file as Express.Multer.File | undefined;
    const newReceiptImage = file ? file.filename : undefined;

    if (file) {
      newUploadedFilePath = path.join(uploadPath, file.filename);
    }

    /* =============================
       FIND TRANSACTION
    ============================= */

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      // cleanup newly uploaded file if transaction not found
      if (newUploadedFilePath && fs.existsSync(newUploadedFilePath)) {
        fs.unlinkSync(newUploadedFilePath);
      }

      return res.status(404).json({
        status: 404,
        error: "Transaction not found",
      });
    }

    /* =============================
       VALIDATION
    ============================= */

    if (
      transaction.transaction_type !== "PKR_RUNNING" &&
      transaction.transaction_type !== "AED_RUNNING"
    ) {
      return res.status(400).json({
        status: 400,
        error: "Only running transactions can be updated",
      });
    }

    if (direction && !["to_company", "to_customer"].includes(direction)) {
      return res.status(400).json({
        status: 400,
        error: "Invalid direction",
      });
    }

    if (currency && !["PKR", "AED"].includes(currency)) {
      return res.status(400).json({
        status: 400,
        error: "Invalid currency",
      });
    }

    if (currency === "PKR" && amount_pkr === undefined) {
      return res.status(400).json({
        status: 400,
        error: "amount_pkr is required for PKR currency",
      });
    }

    if (currency === "AED" && amount_aed === undefined) {
      return res.status(400).json({
        status: 400,
        error: "amount_aed is required for AED currency",
      });
    }

    /* =============================
       APPLY UPDATES
    ============================= */

    if (currency !== undefined) transaction.currency = currency;
    if (direction !== undefined) transaction.direction = direction;
    if (amount_pkr !== undefined) transaction.amount_pkr = amount_pkr;
    if (amount_aed !== undefined) transaction.amount_aed = amount_aed;
    if (description !== undefined) transaction.description = description;

    /* =============================
       FILE REPLACEMENT (CRITICAL)
    ============================= */

    if (newReceiptImage) {
      const oldFileName = transaction.receipt_image;

      // assign new file
      transaction.receipt_image = newReceiptImage;

      // delete old file safely
      if (oldFileName) {
        const oldFilePath = path.join(uploadPath, oldFileName);

        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
            console.log("Old file deleted:", oldFileName);
          } catch (err) {
            console.error("Error deleting old file:", err);
          }
        }
      }
    }

    /* =============================
       SAVE
    ============================= */

    await transaction.save();

    /* =============================
       RESPONSE
    ============================= */

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const transactionWithUrl = {
      ...transaction.toObject(),
      receipt_image: transaction.receipt_image
        ? `${baseUrl}/uploads/${transaction.receipt_image}`
        : null,
    };

    return res.status(200).json({
      status: 200,
      message: "Transaction updated successfully",
      transaction: transactionWithUrl,
    });
  } catch (error) {
    console.error("Update Transaction Error:", error);

    /* =============================
       CLEANUP NEW FILE ON FAILURE
    ============================= */

    if (newUploadedFilePath && fs.existsSync(newUploadedFilePath)) {
      try {
        fs.unlinkSync(newUploadedFilePath);
        console.log("Cleaned up new uploaded file after failure");
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }

    return res.status(500).json({
      status: 500,
      error: "Server error",
    });
  }
};



export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res
        .status(400)
        .json({ status: 400, error: "Transaction ID is required" });
    }

    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        status: "deleted",
        deleted_at: new Date(),
        deleted_by: req.user.userId,
      },
      { new: true }
    );

    if (!transaction) {
      return res
        .status(404)
        .json({ status: 404, error: "Transaction not found" });
    }

    res.json({
      status: 200,
      message: "Transaction deleted successfully",
      serial_no: transaction.serial_no,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, error: "Server error" });
  }
};
