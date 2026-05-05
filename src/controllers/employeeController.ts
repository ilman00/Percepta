import { Request, Response } from "express";
import { User } from "../models/Users";
import { Transaction } from "../models/transactions";
import { CurrencyExchange } from "../models/CurrencyExchange";
import { AuthRequest } from "../middlewares/authMiddleware";
import bcrypt from "bcryptjs";


export const getEmployeeActivity = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string)?.trim();

    /* -------------------------
    1️⃣ Find employees by search
 --------------------------*/
    // Option A: Explicitly include active and inactive
    const userFilter: any = {
      role: "employee", // Ensure only employees are fetched
      status: { $in: ["active", "inactive"] } // Explicitly allow both
    };

    // OR Option B: Simply exclude deleted (shorter if you have many other statuses)
    // const userFilter: any = { status: { $ne: "delete" } };

    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await User.find(userFilter).select("_id name username");

    const employeeIds = employees.map((e) => e._id);

    if (employeeIds.length === 0) {
      return res.json({ page, limit, total: 0, data: [] });
    }

    /* -------------------------
       2️⃣ Fetch transactions
    --------------------------*/
    const transactions = await Transaction.find({
      employee: { $in: employeeIds },
    })
      .populate("employee", "name username")
      .lean();

    /* -------------------------
       3️⃣ Fetch exchanges
    --------------------------*/
    const exchanges = await CurrencyExchange.find({
      employeeId: { $in: employeeIds },
    })
      .populate("employeeId", "name username")
      .lean();

    /* -------------------------
       4️⃣ Normalize data
    --------------------------*/
    const transactionData = transactions.map((t) => ({
      source: "TRANSACTION",
      serial_no: t.serial_no,
      employee: t.employee,
      transaction_type: t.transaction_type,
      currency: t.currency,
      direction: t.direction,
      amount_pkr: t.amount_pkr,
      amount_aed: t.amount_aed,
      created_at: t.created_at,
    }));

    const exchangeData = exchanges.map((e) => ({
      source: "EXCHANGE",
      serial_no: e.serial_no,
      employee: e.employeeId,
      type: e.type,
      aedAmount: e.aedAmount,
      pkrAmount: e.pkrAmount,
      rate: e.rate,
      createdAt: e.createdAt,
    }));

    /* -------------------------
       5️⃣ Merge + sort by date
    --------------------------*/
    const merged = [...transactionData, ...exchangeData].sort(
      (a: any, b: any) =>
        new Date(b.created_at || b.createdAt).getTime() -
        new Date(a.created_at || a.createdAt).getTime()
    );

    const total = merged.length;
    const paginated = merged.slice(skip, skip + limit);

    res.status(200).json({
      status: 200,
      page,
      limit,
      total,
      data: paginated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, error: "Server error" });
  }
};


export const softDeleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params; // employee id to delete
    const currentUserId = req.user.userId;
    const currentUserRole = req.user.role;

    // 1. Only super_admin allowed
    if (currentUserRole !== "super_admin") {
      return res.status(403).json({
        status: 403,
        message: "Only super admin can delete users."
      });
    }

    // 2. Prevent deleting yourself
    if (userId === currentUserId) {
      return res.status(400).json({
        status: 400,
        message: "You cannot delete your own account."
      });
    }

    // 3. Find the user to delete
    const user = await User.findById(userId);

    if (!user || user.status === "deleted") {
      return res.status(404).json({
        status: 404,
        message: "User not found or already deleted."
      });
    }

    // 4. Only employees can be deleted
    if (user.role !== "employee") {
      return res.status(400).json({
        status: 400,
        message: "Only employee accounts can be deleted."
      });
    }

    // 5. Soft delete
    user.status = "deleted";
    await user.save();

    return res.status(200).json({
      status: 200,
      message: "Employee deleted successfully."
    });

  } catch (error) {
    console.error("Delete employee error:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error."
    });
  }
};


export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, username, status, password } = req.body;

    const currentUserId = req.user.userId;
    const currentUserRole = req.user.role;

    if (currentUserRole !== "super_admin") {
      return res.status(403).json({
        status: 403,
        message: "Only super admin can update employees."
      });
    }

    if (userId === currentUserId) {
      return res.status(400).json({
        status: 400,
        message: "You cannot update your own account."
      });
    }

    const employee = await User.findById(userId);

    if (!employee || employee.status === "deleted") {
      return res.status(404).json({
        status: 404,
        message: "Employee not found or deleted."
      });
    }

    if (employee.role !== "employee") {
      return res.status(400).json({
        status: 400,
        message: "Only employee accounts can be updated."
      });
    }

    if ("role" in req.body) {
      return res.status(400).json({
        status: 400,
        message: "Changing role is not allowed."
      });
    }

    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        status: 400,
        message: "Status must be active or inactive."
      });
    }

    if (name !== undefined) employee.name = name;
    if (username !== undefined) employee.username = username;
    if (status !== undefined) employee.status = status;

    if (password !== undefined) {
      const saltRounds = 10;
      employee.password = await bcrypt.hash(password, saltRounds);
    }

    await employee.save();

    return res.status(200).json({
      status: 200,
      message: "Employee updated successfully.",
      employee: {
        _id: employee._id,
        name: employee.name,
        username: employee.username,
        status: employee.status
      }
    });

  } catch (error: any) {

    // 👇 HANDLE DUPLICATE USERNAME ERROR
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(400).json({
        status: 400,
        message: "Username already exists. Please choose another one."
      });
    }

    console.error("Update employee error:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error."
    });
  }
};
