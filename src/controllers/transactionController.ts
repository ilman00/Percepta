import { Request, Response } from "express";
import { Transaction } from "../models/transactions";
import { AuthRequest } from "../middlewares/authMiddleware";
import { User } from "../models/Users";
import { sendPushNotificationToMany } from "../service/notification.service";


export const createTransaction = async (req: Request, res: Response) => {
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

    const file = req.file as Express.MulterS3.File | undefined;
    const receipt_image = file ? file.key : undefined;

    /* =============================
       VALIDATION
    ============================= */

    const validTypes = ["PKR_RUNNING", "AED_RUNNING"];

    if (!validTypes.includes(transaction_type)) {
      return res.status(400).json({ error: "Invalid transaction type" });
    }

    if (transaction_type === "PKR_RUNNING" || transaction_type === "AED_RUNNING") {
      if (!direction)
        return res.status(400).json({ error: "Direction is required" });

      if (!currency)
        return res.status(400).json({ error: "Currency is required" });

      if (!["PKR", "AED"].includes(currency))
        return res.status(400).json({ error: "Invalid currency" });

      if (!amount_pkr && !amount_aed)
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

    (async () => {
      try {
        const users = await User.find({
          status: "active",
          fcmTokens: { $exists: true, $ne: [] },
        }).select("fcmTokens name");

        const tokens = users.flatMap((u) => u.fcmTokens || []);

        if (!tokens.length) return;

        const amount =
          currency === "PKR" ? `${amount_pkr} PKR` : `${amount_aed} AED`;

        const title = "New Customer Transaction";

        const body = `${direction} ${amount} (${transaction_type})`;

        await sendPushNotificationToMany(tokens, title, body);
      } catch (error) {
        console.error("Notification background error:", error);
      }
    })();

    /* =============================
       RESPONSE
    ============================= */

    res.status(201).json({
      message: "Transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("Create Transaction Error:", error);

    res.status(500).json({
      error: "Server error",
    });
  }
};


export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    const {
      currency,
      direction,
      amount_pkr,
      amount_aed,
      description,
    } = req.body;

    // 📸 Handle optional receipt image
    const file = req.file as Express.MulterS3.File | undefined;
    const receipt_image = file ? file.key : undefined;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        status: 404,
        error: "Transaction not found",
      });
    }

    // 🚫 Only running transactions are editable
    if (
      transaction.transaction_type !== "PKR_RUNNING" &&
      transaction.transaction_type !== "AED_RUNNING"
    ) {
      return res.status(400).json({
        status: 400,
        error: "Only running transactions can be updated",
      });
    }

    // 🔁 Validate direction
    if (direction && !["to_company", "to_customer"].includes(direction)) {
      return res.status(400).json({
        status: 400,
        error: "Invalid direction",
      });
    }

    // 💱 Validate currency
    if (currency && !["PKR", "AED"].includes(currency)) {
      return res.status(400).json({
        status: 400,
        error: "Invalid currency",
      });
    }

    // 💸 Currency ↔ amount consistency
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

    // 🧠 Apply updates safely
    if (currency !== undefined) transaction.currency = currency;
    if (direction !== undefined) transaction.direction = direction;
    if (amount_pkr !== undefined) transaction.amount_pkr = amount_pkr;
    if (amount_aed !== undefined) transaction.amount_aed = amount_aed;
    if (description !== undefined) transaction.description = description;

    // 📸 Update receipt image only if new one is uploaded
    if (receipt_image) {
      transaction.receipt_image = receipt_image;

      // (Optional) TODO:
      // delete old image from filesystem here if needed
    }

    await transaction.save();

    res.status(200).json({
      status: 200,
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
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
