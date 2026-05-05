import { Request, Response } from "express";
import { CurrencyExchange, ICurrencyExchange } from "../models/CurrencyExchange";
import { AuthRequest } from "../middlewares/authMiddleware";
import { sendPushNotificationToMany } from "../service/notification.service";
import { User } from "../models/Users";


// Create a new currency transaction
export const createCustomerBuyOrSellTransaction = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { customerName, customerPhone, type, aedAmount, rate, pkrAmount } =
      req.body;

    const employeeId = req.user?.userId;

    if (!employeeId || !customerName || !type || !aedAmount || !rate) {
      return res.status(400).json({
        status: 400,
        message: "All required fields must be provided.",
      });
    }

    const transaction: ICurrencyExchange = new CurrencyExchange({
      employeeId,
      customerName,
      customerPhone: customerPhone || "",
      type,
      baseCurrency: "AED",
      quoteCurrency: "PKR",
      aedAmount,
      rate,
      pkrAmount,
    });

    await transaction.save();

    /* =============================
       SEND NOTIFICATION (SAFE)
    ============================= */

    (async () => {
      try {
        const [users, employee] = await Promise.all([
          User.find({
            status: "active",
            fcmTokens: { $exists: true, $ne: [] },
          }).select("fcmTokens"),
          User.findById(employeeId).select("name"),
        ]);

        const tokens = users.flatMap((user) => user.fcmTokens || []);

        if (tokens.length === 0) return;

        const employeeName = employee?.name ?? "An employee";

        const title = "New Currency Transaction";
        const body = `${employeeName} ${
          type === "BUY" ? "bought" : "sold"
        } ${aedAmount} AED`;

        await sendPushNotificationToMany(tokens, title, body);
      } catch (error) {
        console.error("Notification background error:", error);
      }
    })();

    /* ============================= */

    return res.status(201).json({
      status: 201,
      message: "Transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("Transaction Error:", error);

    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};
// Fetch all transactions or filter by employee/customer


export const getCustomerBuyOrSellTransaction = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { page = 1, limit = 10, search, type = "ALL" } = req.query;

    const pageNumber = Math.max(parseInt(page as string, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit as string, 10) || 10, 1);
    const skip = (pageNumber - 1) * pageSize;

    // ✅ Base filter (not deleted)
    const filter: any = {
      status: { $ne: "deleted" },
    };

    // ✅ BUY / SELL filter
    if (type !== "ALL") {
      filter.type = type; // BUY or SELL
    }

    // ✅ Search filter
    // ✅ Search filter (keyword based)
    if (search) {
      const keywords = (search as string).trim().split(/\s+/);

      filter.$or = [
        {
          customerName: {
            $regex: keywords.join("|"),
            $options: "i",
          },
        },
        {
          customerPhone: {
            $regex: keywords.join("|"),
            $options: "i",
          },
        },
      ];
    }

    const total = await CurrencyExchange.countDocuments(filter);

    const transactions = await CurrencyExchange.find(filter)
      .populate("employeeId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    return res.status(200).json({
      status: 200,
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      transactions,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 500, message: "Server error" });
  }
};




export const editCustomerBuyOrSellTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { customerName, customerPhone, type, aedAmount, rate, pkrAmount } = req.body;

    if (!id) return res.status(400).json({ status: 400, message: "Transaction ID is required." });

    // Fetch existing transaction
    const transaction = await CurrencyExchange.findById(id);
    if (!transaction) return res.status(404).json({ status: 404, message: "Transaction not found." });

    // Update fields if provided
    if (customerName !== undefined) transaction.customerName = customerName;
    if (customerPhone !== undefined) transaction.customerPhone = customerPhone;
    if (type !== undefined) transaction.type = type;
    if (aedAmount !== undefined) transaction.aedAmount = aedAmount;
    if (rate !== undefined) transaction.rate = rate;

    // Update expected and actual PKR
    transaction.expectedPkrAmount = transaction.aedAmount * transaction.rate;
    if (pkrAmount !== undefined) transaction.pkrAmount = pkrAmount;

    await transaction.save();

    return res.status(200).json({ status: 200, message: "Transaction updated successfully", transaction });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 500, message: "Server error" });
  }
};


export const deleteCustomerBuyOrSellTransaction = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ status: 400, message: "Transaction ID is required." });
    }

    const deleted = await CurrencyExchange.findByIdAndUpdate(
      id,
      {
        status: "deleted",
        deleted_at: new Date(),
        deleted_by: req.user.userId,
      },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({ status: 404, message: "Transaction not found." });
    }

    return res
      .status(200)
      .json({ status: 200, message: "Transaction deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 500, message: "Server error" });
  }
};

