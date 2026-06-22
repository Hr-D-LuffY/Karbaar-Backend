import bcrypt from "bcrypt";
import { pool } from "./index";

const createShop = async () => {
	const hashpassword = await bcrypt.hash("demo1234", 12);

	await pool.query(
		`INSERT INTO shop (full_name , press_name ,initial, email ,password ,phone ,business) 
    VALUES ($1, $2, $3, $4, $5, $6 ,$7)`,
		[
			"Demo",
			"Demo Shop",
			"DS",
			"demo@yourshop.com",
			hashpassword,
			"1234567890",
			"both",
		],
	);

	console.log("✅ Demo shop created!");
	process.exit();
};

createShop();
