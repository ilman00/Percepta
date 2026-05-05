import { Request, Response } from "express";
import { CurrencyExchange } from "../models/CurrencyExchange";
import { Transaction } from "../models/transactions";

export const getHomeDashboardStats = async (req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const stats = await CurrencyExchange.aggregate([
      {
        $match: {
          status: "active",
        },
      },
      {
        $group: {
          _id: null,

          // ===== AED =====
          aedIn: {
            $sum: {
              $cond: [{ $eq: ["$type", "BUY"] }, "$aedAmount", 0],
            },
          },
          aedOut: {
            $sum: {
              $cond: [{ $eq: ["$type", "SELL"] }, "$aedAmount", 0],
            },
          },

          // ===== PKR =====
          pkrOut: {
            $sum: {
              $cond: [{ $eq: ["$type", "BUY"] }, "$pkrAmount", 0],
            },
          },
          pkrIn: {
            $sum: {
              $cond: [{ $eq: ["$type", "SELL"] }, "$pkrAmount", 0],
            },
          },

          // ===== VOLUME =====
          totalDeals: { $sum: 1 },
          aedVolume: { $sum: "$aedAmount" },
          pkrVolume: { $sum: "$pkrAmount" },

          // ===== EXPECTED vs ACTUAL =====
          expectedPkr: { $sum: "$expectedPkrAmount" },
          actualPkr: { $sum: "$pkrAmount" },

          // ===== RATES =====
          avgBuyRate: {
            $avg: {
              $cond: [{ $eq: ["$type", "BUY"] }, "$rate", null],
            },
          },
          avgSellRate: {
            $avg: {
              $cond: [{ $eq: ["$type", "SELL"] }, "$rate", null],
            },
          },
        },
      },
    ]);

    const todayStats = await CurrencyExchange.aggregate([
      {
        $match: {
          status: "active",
          createdAt: { $gte: todayStart },
          type: "BUY",
        },
      },
      {
        $group: {
          _id: null,
          deals: { $sum: 1 },
          aedBought: { $sum: "$aedAmount" },
          pkrPaid: { $sum: "$pkrAmount" },
        },
      },
    ]);

    const main = stats[0] || {};
    const today = todayStats[0] || {};

    res.json({
      cashPosition: {
        aed: {
          in: main.aedIn || 0,
          out: main.aedOut || 0,
          balance: (main.aedIn || 0) - (main.aedOut || 0),
        },
        pkr: {
          in: main.pkrIn || 0,
          out: main.pkrOut || 0,
          balance: (main.pkrIn || 0) - (main.pkrOut || 0),
        },
      },

      activity: {
        totalDeals: main.totalDeals || 0,
        aedVolume: main.aedVolume || 0,
        pkrVolume: main.pkrVolume || 0,
      },

      today: {
        deals: today.deals || 0,
        aedBought: today.aedBought || 0,
        pkrPaid: today.pkrPaid || 0,
      },

      efficiency: {
        expectedPkr: main.expectedPkr || 0,
        actualPkr: main.actualPkr || 0,
        difference: (main.actualPkr || 0) - (main.expectedPkr || 0),
      },

      rates: {
        avgBuy: main.avgBuyRate || 0,
        avgSell: main.avgSellRate || 0,
        spread:
          (main.avgSellRate || 0) - (main.avgBuyRate || 0),
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
};


export const getTransactionDashboardStats = async (
  req: Request,
  res: Response
) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ===== OVERALL STATS =====
    const overall = await Transaction.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: null,

          // PKR
          pkrIn: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$currency", "PKR"] },
                    { $eq: ["$direction", "to_company"] },
                  ],
                },
                "$amount_pkr",
                0,
              ],
            },
          },
          pkrOut: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$currency", "PKR"] },
                    { $eq: ["$direction", "to_customer"] },
                  ],
                },
                "$amount_pkr",
                0,
              ],
            },
          },

          // AED
          aedIn: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$currency", "AED"] },
                    { $eq: ["$direction", "to_company"] },
                  ],
                },
                "$amount_aed",
                0,
              ],
            },
          },
          aedOut: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$currency", "AED"] },
                    { $eq: ["$direction", "to_customer"] },
                  ],
                },
                "$amount_aed",
                0,
              ],
            },
          },

          totalTransactions: { $sum: 1 },
          pkrVolume: { $sum: "$amount_pkr" },
          aedVolume: { $sum: "$amount_aed" },

          totalProfit: { $sum: "$profit" },
        },
      },
    ]);

    // ===== TODAY STATS =====
    const today = await Transaction.aggregate([
      {
        $match: {
          status: "active",
          created_at: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,

          transactions: { $sum: 1 },

          pkrIn: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$currency", "PKR"] },
                    { $eq: ["$direction", "to_company"] },
                  ],
                },
                "$amount_pkr",
                0,
              ],
            },
          },
          pkrOut: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$currency", "PKR"] },
                    { $eq: ["$direction", "to_customer"] },
                  ],
                },
                "$amount_pkr",
                0,
              ],
            },
          },

          aedIn: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$currency", "AED"] },
                    { $eq: ["$direction", "to_company"] },
                  ],
                },
                "$amount_aed",
                0,
              ],
            },
          },
          aedOut: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$currency", "AED"] },
                    { $eq: ["$direction", "to_customer"] },
                  ],
                },
                "$amount_aed",
                0,
              ],
            },
          },

          profitToday: { $sum: "$profit" },
        },
      },
    ]);

    const main = overall[0] || {};
    const todayStats = today[0] || {};

    res.json({
      cashPosition: {
        pkr: {
          in: main.pkrIn || 0,
          out: main.pkrOut || 0,
          balance: (main.pkrIn || 0) - (main.pkrOut || 0),
        },
        aed: {
          in: main.aedIn || 0,
          out: main.aedOut || 0,
          balance: (main.aedIn || 0) - (main.aedOut || 0),
        },
      },

      activity: {
        totalTransactions: main.totalTransactions || 0,
        pkrVolume: main.pkrVolume || 0,
        aedVolume: main.aedVolume || 0,
      },

      today: {
        transactions: todayStats.transactions || 0,
        pkrIn: todayStats.pkrIn || 0,
        pkrOut: todayStats.pkrOut || 0,
        aedIn: todayStats.aedIn || 0,
        aedOut: todayStats.aedOut || 0,
      },

      profit: {
        total: main.totalProfit || 0,
        today: todayStats.profitToday || 0,
      },
    });
  } catch (error) {
    console.error("Transaction dashboard error:", error);
    res.status(500).json({ message: "Failed to load transaction stats" });
  }
};
