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
    try {
        const decodedtoken = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; email: string };
        // Mapear userId a id para mantener consistencia
        req.user = {
            id: decodedtoken.userId,
            email: decodedtoken.email
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid authentication token" });
    }

};

export { AuthRequest };