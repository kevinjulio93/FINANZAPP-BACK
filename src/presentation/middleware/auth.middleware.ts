import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export const AuthenticationToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ message: "Authentication token missing" });
    }
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    try {
        const decodedtoken = jwt.verify(token, secret) as { userId: string; email: string };

        req.user = {
            id: decodedtoken.userId,
            email: decodedtoken.email
        };
        next();
    } catch (error: any) {
        console.error('Authentication Error:', error.message);
        const secretLength = (process.env.JWT_SECRET || 'your-secret-key').length;
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired. Please login again." });
        }
        return res.status(401).json({ message: "Invalid authentication token" });
    }

};

export { AuthRequest };