"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.generateJwtToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorObject_1 = require("./errorObject");
const customErrorCode_1 = require("./customErrorCode");
dotenv_1.default.config();
const generateJwtToken = (payload) => {
    var _a;
    const secretKey = ((_a = process.env.JWT_SECRET_KEY) !== null && _a !== void 0 ? _a : "Roriri_Cafe");
    const options = { expiresIn: '1h' };
    const token = jsonwebtoken_1.default.sign(payload, secretKey, options);
    return token;
};
exports.generateJwtToken = generateJwtToken;
const authenticateToken = (req, res, next) => {
    var _a;
    const authHeader = req.headers.authorization ? req.headers.authorization : req.query.token;
    if (!authHeader) {
        return (0, errorObject_1.sendErrorObj)(res, customErrorCode_1.token_err, "Token Not Found!");
    }
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return (0, errorObject_1.sendErrorObj)(res, customErrorCode_1.token_err, "Token Not Found!");
    }
    const secretKey = ((_a = process.env.JWT_SECRET_KEY) !== null && _a !== void 0 ? _a : "Roriri_Cafe");
    jsonwebtoken_1.default.verify(token, secretKey, (err, decoded) => {
        if (err) {
            // send a string message (not the VerifyErrors object)
            const message = err && typeof err.message === 'string' ? err.message : String(err);
            return (0, errorObject_1.sendErrorObj)(res, customErrorCode_1.token_err, message);
        }
        // decoded can be a string (if original payload was a string) or an object
        let user = null;
        if (!decoded) {
            return (0, errorObject_1.sendErrorObj)(res, customErrorCode_1.token_err, "Invalid token payload");
        }
        else if (typeof decoded === 'string') {
            try {
                user = JSON.parse(decoded);
            }
            catch (_a) {
                // fallback: put the raw string in user object so downstream doesn't crash
                user = { sub: decoded };
            }
        }
        else {
            user = decoded;
        }
        req.user = user;
        if (user && typeof user === 'object' && 'exp' in user && typeof user.exp === 'number') {
            if (Date.now() >= user.exp * 1000) {
                return (0, errorObject_1.sendErrorObj)(res, 'TOKEN_EXP', "Token Expired!");
            }
        }
        return next();
    });
};
exports.authenticateToken = authenticateToken;
