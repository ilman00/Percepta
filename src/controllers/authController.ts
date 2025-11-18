import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/Users";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email, and password are required." });

    // Check existing user
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered." });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user (role always 'admin' for self registration)
    const user = new User({
      name,
      email,
      password: hashed,
      role: "admin",
      status: "pending",
    });

    await user.save();

    res.status(201).json({
      status: 200,
      message: "Registration successful. Await super admin approval.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({status: 500, message: "Internal server error." });
  }
};



export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({status: 400, message: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials." });

    if (user.status !== "approved")
      return res.status(403).json({ message: "Account not approved by super admin." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials." });

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
        email: user.email,
        role: user.role,
      },
      tokens: {
        access: accessToken,
        refresh: refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


