import fs from "fs";
import path from "path";

// Base directory (project root safe)
const baseDir = process.env.FILE_UPLOAD_PATH || path.join(process.cwd(), "data", "uploads");

export const uploadPath = baseDir;
console.log("Upload path:", uploadPath);
// ensure directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}