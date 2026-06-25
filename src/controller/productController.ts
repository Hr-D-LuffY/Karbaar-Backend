import { type Request, type Response } from "express";
import { pool } from "../db";

export const getAllProducts = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { category_id } = req.query;
		let query = `SELECT DISTINCT name FROM products `;
		const values: any[] = [];

		if (category_id) {
			query += `WHERE category_id = $1`;
			values.push(category_id);
		}
		const result = await pool.query(query, values);
		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching products:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getProductInfo = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { category_id, name } = req.query;
		const result = await pool.query(
			`
            SELECT
                p.id,
                c.id AS company_id,
                c.name AS company_name,
                pt.id AS type_id,
                pt.code AS type_code
            FROM products p
            JOIN companies c
                ON c.id = p.company_id
            JOIN product_types pt
                ON pt.id = p.type
            WHERE p.category_id = $1
            AND p.name = $2;
            `,
			[category_id, name],
		);
		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching products:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
