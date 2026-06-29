import { type Request, type Response } from "express";
import { pool } from "../db";

export const restockProducts = async (req: Request, res: Response) => {
	const shopId = (req as any).user.userId;
	const { vendor, payment, items } = req.body;

	if (!items || items.length === 0) {
		return res.status(400).json({ message: "No items provided" });
	}
	for (const item of items) {
		if (
			!item.productId ||
			(item.reams === 0 && item.sheets === 0) ||
			!item.price
		) {
			return res.status(400).json({
				message: "Each item needs productId, price, and reams or sheets",
			});
		}
	}

	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		// --- Step 1: Vendor ---
		const vendorId = vendor.clientId ?? null;
		if (vendorId && payment.isDue) {
			await client.query(
				`
                UPDATE vendors SET due_amount = due_amount + $1
                WHERE id = $2 AND shop_id = $3
                `,
				[payment.dueBalance, vendorId, shopId],
			);
		}

		// --- Step 2: Restock session ---
		const sessionResult = await client.query(
			`
            INSERT INTO restock_sessions 
            (shop_id, vendor_id,total_amount, 
            transport_cost, grand_total, paid_amount, due_amount, is_due)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id`,
			[
				shopId,
				vendorId,
				Math.round(payment.grandTotal - payment.transportCost),
				payment.transportCost,
				payment.grandTotal,
				payment.advance,
				payment.dueBalance,
				payment.isDue,
			],
		);

		const sessionId = sessionResult.rows[0].id;

		// --- Step 3: Transport share calculation ---
		const totalBeforeTransport = items.reduce(
			(sum: number, item: any) => sum + item.lineTotal,
			0,
		);
		let transportDistributed = 0;

        console.log(totalBeforeTransport)

		await client.query("COMMIT");
		res.json({ due: payment.dueBalance });
	} catch (err) {
		await client.query("ROLLBACK");
		console.error(err);
		res.status(500).json({ message: "Restock failed" });
	} finally {
		client.release();
	}
};
