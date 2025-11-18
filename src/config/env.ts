import dotenv from "dotenv";

dotenv.config()

export const env = {
  mongodbUri: process.env.MONGODB_URI ,
  serverPort: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET
};