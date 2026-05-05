import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { User } from "../models/Users";
import { Transaction } from "../models/transactions";
import { CurrencyExchange } from "../models/CurrencyExchange";


export const employeeList = async (req: AuthRequest, res: Response) => {
  try {
    const adminUser = req.user;

    if (!adminUser || adminUser.role !== "super_admin") {
      return res.status(403).json({
        status: 403,
        message: "Only super admins can access employee list."
      });
    }

    const employees = await User.find({
      role: "employee",
      status: { $in : ["active", "inactive"] }
    });

    return res.status(200).json({
      status: 200,
      data: employees
    });
  } catch (error) {
    console.error("Employee list error:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error."
    });
  }
};



export const deactivateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const adminUser = req.user;

    if (!employeeId)
      return res.status(400).json({ status: 400, message: "Employee ID is required." });

    if (!adminUser || adminUser.role !== "super_admin")
      return res.status(403).json({ status: 403, message: "Only super admins can deactivate employees." });

    const employee = await User.findByIdAndUpdate(
      employeeId,
      { status: "inactive" },
      { new: true }
    );

    if (!employee)
      return res.status(404).json({ status: 404, message: "Employee not found." });

    return res.status(200).json({
      status: 200,
      message: "Employee deactivated successfully.",
      data: employee,
    });

  } catch (error) {
    console.error("Deactivate employee error:", error);
    return res.status(500).json({ status: 500, message: "Internal server error." });
  }
};

export const activateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const adminUser = req.user;

    if (!employeeId)
      return res.status(400).json({ status: 400, message: "Employee ID is required." });

    if (!adminUser || adminUser.role !== "super_admin")
      return res.status(403).json({ status: 403, message: "Only super admins can activate employees." });

    const employee = await User.findByIdAndUpdate(
      employeeId,
      { status: "active" },
      { new: true }
    );

    if (!employee)
      return res.status(404).json({ status: 404, message: "Employee not found." });

    return res.status(200).json({
      status: 200,
      message: "Employee activated successfully.",
      data: employee,
    });

  } catch (error) {
    console.error("Activate employee error:", error);
    return res.status(500).json({ status: 500, message: "Internal server error." });
  }
};

export const getDeletedTransactionsAdmin = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * pageSize;

    const matchStage: any = {
      status: "deleted",
    };

    if (search) {
      matchStage.$or = [
        { serial_no: Number(search) || -1 },
        { "employee.name": { $regex: search as string, $options: "i" } },
        { "customer.name": { $regex: search as string, $options: "i" } },
      ];
    }

    const result = await Transaction.aggregate([
      // only deleted
      { $match: { status: "deleted" } },

      // join employee
      {
        $lookup: {
          from: "users",
          localField: "employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },

      // join customer
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },

      // search
      { $match: matchStage },

      { $sort: { deleted_at: -1 } },

      // pagination + count in ONE query
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: pageSize },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const transactions = result[0].data;
    const total = result[0].total[0]?.count || 0;

    res.status(200).json({
      status: 200,
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: "Server error" });
  }
};


export const getDeletedCustomerBuySellAdmin = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * pageSize;

    const matchStage: any = {
      status: "deleted",
    };

    if (search) {
      matchStage.$or = [
        { serial_no: Number(search) || -1 },
        { customerName: { $regex: search as string, $options: "i" } },
        { "employee.name": { $regex: search as string, $options: "i" } },
      ];
    }

    const result = await CurrencyExchange.aggregate([
      // only deleted
      { $match: { status: "deleted" } },

      // join employee
      {
        $lookup: {
          from: "users",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },

      // search
      { $match: matchStage },

      { $sort: { deleted_at: -1 } },

      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: pageSize },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const transactions = result[0].data;
    const total = result[0].total[0]?.count || 0;

    res.status(200).json({
      status: 200,
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: "Server error" });
  }
};
