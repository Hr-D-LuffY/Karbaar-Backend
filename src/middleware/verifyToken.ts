import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { type JwtPayload } from "../types/auth";

declare global {
	namespace Express {
		interface Request {
			user?: JwtPayload;
		}
	}
}

const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
	const token = req.cookies.auth_token;

	if (!token) {
		res.status(401).json({ message: "Not authenticated" });
		return;
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
		req.user = decoded;
		next();
	} catch (err) {
		res.status(401).json({ message: "Token expired or invalid" });
	}
};

export default verifyToken;
