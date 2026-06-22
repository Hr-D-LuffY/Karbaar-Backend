import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../db";
import config from "../config";

export const Login = async (req: Request, res: Response): Promise<void> => {
	const { identifier, password, rememberMe } = req.body;

	try {
		const result = await pool.query(
			`
            SELECT * FROM shop WHERE email = $1 OR phone = $1
        `,
			[identifier],
		);

		const user = result.rows[0];
		if (!user) {
			res.status(401).json({ message: "Invalid credentials" });
			return;
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			res.status(401).json({ message: "Invalid credentials" });
			return;
		}

		const token = jwt.sign(
			{
				userId: user.id,
				email: user.email,
				phone: user.phone,
				business: user.business,
				initial: user.initial,
			},
			config.jwt_secret!,
			{ expiresIn: rememberMe ? "7d" : "1d" },
		);

		res.cookie("auth_token", token, {
			httpOnly: true,
			secure: false, // set true in production
			sameSite: "strict",
			maxAge:
				rememberMe ?
					7 * 24 * 60 * 60 * 1000 // 7 days
				:	24 * 60 * 60 * 1000, // 1 day
		});

		res.json({
			message: "Login successful",
			user: {
				id: user.id,
				full_name: user.full_name,
				press_name: user.press_name,
				email: user.email,
				phone: user.phone,
			},
		});
	} catch (err) {
		console.error("Login error:", err);
		res.status(500).json({ message: "Server error" });
		return;
	}
};

export const Logout = (req: Request, res: Response): void => {
	res.clearCookie("auth_token");
	res.json({ message: "Logged out successfully" });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
	try {
		const result = await pool.query(
			`SELECT id, full_name, press_name,initial , email, phone, business as business_type, is_active, created_at 
      FROM shop WHERE id = $1`,
			[req.user?.userId],
		);

		if (!result.rows[0]) {
			res.status(404).json({ message: "User not found" });
		}
		res.json(result.rows[0]);
	} catch (err: any) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};
