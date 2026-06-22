import { Pool } from "pg";
import config from "../config";

export const pool = new Pool({
	connectionString: config.connection_string,
	ssl: { rejectUnauthorized: false },
});

export const initDB = async () => {
	try {
		await pool.query(`
        DO $$ BEGIN
            CREATE TYPE business_type AS ENUM ('material', 'printing', 'both');
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'business_type already exists, skipping';
        END $$;
      `);

		await pool.query(`
        CREATE TABLE IF NOT EXISTS shop (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(50) NOT NULL,
            press_name VARCHAR(100) NOT NULL,
            initial VARCHAR(10) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone VARCHAR(20),
            business business_type NOT NULL DEFAULT 'material',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT now()
        );
        `);
		console.log("Database initialized successfully");
	} catch (error) {
		console.error("Database initialization failed:", error);
		process.exit(1);
	}
};
