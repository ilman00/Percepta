import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { User } from "../models/Users";


export const saveFcmToken = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    await User.updateOne(
      { _id: userId },
      { $addToSet: { fcmTokens: token } } // prevents duplicates
    );

    res.json({
      success: true,
      message: "FCM token stored successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to store token",
    });
  }
};

export const removeFcmToken = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { token } = req.body;

    await User.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: token } }
    );

    res.json({
      success: true,
      message: "Token removed",
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};