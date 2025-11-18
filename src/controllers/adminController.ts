import { Request, Response } from "express";
import { User } from "../models/Users";
import { sendEmail } from "../config/nodemailer";

export const approveAdmin = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params; // admin to approve comes from request body
    const currentUser = (req as any).user; // logged-in super admin

    if (currentUser.role !== "super_admin")
      return res.status(403).json({ message: "Only super admins can approve admins." });

    if (!adminId)
      return res.status(400).json({ message: "Admin ID is required." });

    const admin = await User.findById(adminId);
    if (!admin)
      return res.status(404).json({ message: "Admin not found." });

    if (admin.role !== "admin")
      return res.status(400).json({ message: "User is not an admin." });

    if (admin.status === "approved")
      return res.status(400).json({ message: "Admin already approved." });

    admin.status = "approved";
    await admin.save();

    await sendEmail(
      admin.email,
      "Admin Account Approved",
      `Hello ${admin.name}, your admin account has been approved. You can now log in to the app.`,
      `<p>Hello <strong>${admin.name}</strong>,</p>
       <p>Your admin account has been approved. You can now log in to the app.</p>`
    );

    res.status(200).json({ message: "Admin approved and notified by email." });
  } catch (error) {
    console.error("Approve admin error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const getPendingAdmins = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    if (currentUser.role !== "super_admin")
      return res.status(403).json({ message: "Only super admins can view pending admins." });

    const pendingAdmins = await User.find({ role: "admin", status: "pending" })
      .select("-password") // exclude password field
      .sort({ created_at: -1 });

    res.status(200).json({
      message: "Pending admins fetched successfully.",
      count: pendingAdmins.length,
      data: pendingAdmins,
    });
  } catch (error) {
    console.error("Get pending admins error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};