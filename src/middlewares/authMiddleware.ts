import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthRequest extends Request {
    user?: any;
}


export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decode = verifyAccessToken(token)
        req.user = decode

        next();
    } catch (error: any) {

        console.error(error);
        return res.status(401).json({ message: "Invalid or expired token" });

    }
}