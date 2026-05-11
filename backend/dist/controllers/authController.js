"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const generateToken = (user) => {
    const secret = process.env.JWT_SECRET || 'secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, name: user.name }, secret, {
        expiresIn,
    });
};
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ message: 'Email already registered' });
            return;
        }
        const hashed = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: { name, email, password: hashed },
            select: { id: true, email: true, name: true, avatar: true, createdAt: true },
        });
        const token = generateToken(user);
        res.status(201).json({ token, user });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Registration failed' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const match = await bcryptjs_1.default.compare(password, user.password);
        if (!match) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const token = generateToken(user);
        const { password: _, ...userData } = user;
        res.json({ token, user: userData });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Login failed' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, avatar: true, createdAt: true },
        });
        res.json(user);
    }
    catch {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMe = getMe;
//# sourceMappingURL=authController.js.map