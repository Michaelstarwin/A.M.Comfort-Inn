"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const maxSize = 2 * 1024 * 1024;
const uploadsBaseDir = process.env.UPLOADS_DIR || 'uploads/';
// Ensure the directory exists
const fs_1 = __importDefault(require("fs"));
if (!fs_1.default.existsSync(uploadsBaseDir)) {
    fs_1.default.mkdirSync(uploadsBaseDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsBaseDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filePath = file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname);
        cb(null, filePath);
    }
});
const uploadFile = (fieldName) => {
    return (0, multer_1.default)({ storage: storage, limits: { fileSize: maxSize } }).single(fieldName);
};
const uploadFileMiddleware = (req, res, fieldName) => {
    return new Promise((resolve, reject) => {
        const upload = uploadFile(fieldName);
        upload(req, res, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(req.file?.path);
            }
        });
    });
};
exports.uploadFileMiddleware = uploadFileMiddleware;
//# sourceMappingURL=fileUpload.js.map