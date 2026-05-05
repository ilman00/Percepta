import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/Users";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { AuthRequest } from "../middlewares/authMiddleware";


export const registerAdmin = async (req: AuthRequest, res: Response) => {
  try {
    // Logged in user info is coming from auth middleware
    const requester = (req as any).user;

    if (!requester || requester.role !== "super_admin") {
      return res.status(403).json({
        status: 403,
        message: "Only super admin can create new admins."
      });
    }

    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        status: 400,
        message: "Name, username, and password are required."
      });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({
        status: 400,
        message: "username already registered."
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      username,
      password: hashed,
      role: "employee",
      status: "active"
    });

    await user.save();

    return res.status(201).json({
      status: 201,
      message: "Admin created successfully.",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        status: user.status,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Register admin error:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error."
    });
  }
};




export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ status: 400, message: "username and password are required." });

    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ status: 400, message: "Invalid credentials." });

    if (user.status !== "active" )
      return res.status(403).json({ status: 403, message: "Admin has Deactivated your account." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ status: 400, message: "Invalid credentials." });

    user.last_login = new Date();
    await user.save();

    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id });

    res.status(200).json({
      status: 200,
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      tokens: {
        access: accessToken,
        refresh: refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
};


export const refreshTokens = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken)
      return res.status(400).json({
        status: 400,
        message: "Refresh token is required.",
      });

    let decoded: any;

    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({
        status: 401,
        message: "Invalid or expired refresh token.",
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user)
      return res.status(401).json({
        status: 401,
        message: "User not found.",
      });

    if (user.status !== "active")
      return res.status(403).json({
        status: 403,
        message: "Account is inactive.",
      });

    const newAccessToken = generateAccessToken({
      userId: user._id,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user._id,
    });

    res.status(200).json({
      status: 200,
      message: "Tokens refreshed successfully.",
      tokens: {
        access: newAccessToken,
        refresh: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal server error.",
    });
  }
};


export const adminChangeUserPassword = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;

    // Only super admin allowed
    if (!requester || requester.role !== "super_admin") {
      return res.status(403).json({
        status: 403,
        message: "Only super admin can change passwords."
      });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        status: 400,
        message: "Password must be at least 6 characters."
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found."
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    await user.save();

    return res.status(200).json({
      status: 200,
      message: "Password updated successfully."
    });

  } catch (error) {
    console.error("Admin change password error:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error."
    });
  }
};

export const changeOwnPassword = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 400,
        message: "Current and new password are required."
      });
    }

    const user = await User.findById(requester.userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found."
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: 400,
        message: "Current password is incorrect."
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    await user.save();

    return res.status(200).json({
      status: 200,
      message: "Password changed successfully."
    });

  } catch (error) {
    console.error("Change own password error:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error."
    });
  }
};