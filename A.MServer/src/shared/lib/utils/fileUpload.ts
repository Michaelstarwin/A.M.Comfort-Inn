import multer from "multer";
import path from "path";
import { Request } from "express";

const maxSize = 2 * 1024 * 1024;

const uploadsBaseDir = process.env.UPLOADS_DIR || 'uploads/';
// Ensure the directory exists
import fs from 'fs';
if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsBaseDir);
  },
  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filePath = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filePath);
  }
});

const uploadFile = (fieldName: string) => {
  return multer({ storage: storage, limits: { fileSize: maxSize } }).single(fieldName);
};

const uploadFileMiddleware = (req: Request, res: any, fieldName: string) => {
  return new Promise((resolve, reject) => {
    const upload = uploadFile(fieldName);
    upload(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(req.file?.path); 
      }
    });
  });
};

export { uploadFileMiddleware };