import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { Request } from "express";
import { s3 } from "./../config/s3";

export const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "private", // or "public-read" if needed
    metadata: (req: Request, file, cb) => {
      cb(null, {
        originalName: file.originalname,
      });
    },
    key: (req: Request, file, cb) => {
      console.log("Uploading File:", file.originalname);

      const uniqueSuffix =
        Date.now() + "-" + Math.round(Math.random() * 1e9);

      const extension = path.extname(file.originalname);

      cb(null, `uploads/${uniqueSuffix}${extension}`);
    },
  }),
});
