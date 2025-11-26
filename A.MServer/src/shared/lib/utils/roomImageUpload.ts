import multer, { Multer } from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const baseUploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
const uploadsDir = path.join(baseUploadsDir, 'rooms');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for room images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Accept images only
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
};

export const uploadRoomImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
}).single('image');

export const getRoomImageUrl = (filename: string): string => {
  return `/uploads/rooms/${filename}`;
};