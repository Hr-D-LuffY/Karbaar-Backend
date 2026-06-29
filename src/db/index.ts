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
        DO $$ BEGIN
            CREATE TYPE unit_type AS ENUM ('ream', 'piece', 'kg','lb');
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'unit_type already exists, skipping';
        END $$;
      `);

		await pool.query(`
        CREATE TABLE IF NOT EXISTS  categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL  
            );
        `);

		await pool.query(`
        CREATE TABLE IF NOT EXISTS  companies (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL  
            );
        `);

		await pool.query(`
        CREATE TABLE IF NOT EXISTS  product_types (
            id          SERIAL PRIMARY KEY,
            category_id INT REFERENCES categories(id) NOT NULL,
            code        VARCHAR(20) NOT NULL,   
            label       VARCHAR(100),           
            UNIQUE(category_id, code)
            );
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

		await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id                  SERIAL PRIMARY KEY,
            category_id         INT REFERENCES categories(id) NOT NULL,
            company_id          INT REFERENCES companies(id) NOT NULL,
            name                VARCHAR(150) NOT NULL,       
            type                INT REFERENCES product_types(id) NOT NULL,
            unit                unit_type,         
            sheets_per_ream     INT,           
            created_at          TIMESTAMPTZ DEFAULT now(),
            updated_at          TIMESTAMPTZ DEFAULT now()
);
        `);

		await pool.query(`
            CREATE TABLE IF NOT EXISTS vendors (
                id SERIAL PRIMARY KEY,
                shop_id INT REFERENCES shop(id) NOT NULL,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                due_amount INT NOT NULL DEFAULT 0, 
                created_at TIMESTAMPTZ DEFAULT now()
);
            `);

		await pool.query(`
            CREATE TABLE IF NOT EXISTS restock_sessions  (
                id SERIAL PRIMARY KEY,
                shop_id INT REFERENCES shop(id) NOT NULL,
                vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL,
                total_amount INT NOT NULL,     
                transport_cost INT NOT NULL DEFAULT 0,
                grand_total INT NOT NULL,         
                paid_amount INT NOT NULL DEFAULT 0,
                due_amount INT NOT NULL DEFAULT 0,
                is_due BOOLEAN DEFAULT false,
                purchased_at TIMESTAMPTZ DEFAULT now()
);
            `);

		await pool.query(`
            CREATE TABLE IF NOT EXISTS restock_items   (
                id SERIAL PRIMARY KEY,
                session_id INT REFERENCES restock_sessions(id) NOT NULL,
                product_id INT REFERENCES products(id) NOT NULL,
                reams INT NOT NULL DEFAULT 0,
                sheets INT NOT NULL DEFAULT 0,
                buying_price_per_ream INT NOT NULL,
                transport_share INT NOT NULL DEFAULT 0
);
            `);

		await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory    (
                id SERIAL PRIMARY KEY,
                shop_id INT REFERENCES shop(id) NOT NULL,
                product_id INT REFERENCES products(id) NOT NULL,
                quantity_reams INT NOT NULL DEFAULT 0,
                quantity_sheets INT NOT NULL DEFAULT 0,    
                last_buying_price_per_ream INT NOT NULL DEFAULT 0,
                updated_at TIMESTAMPTZ DEFAULT now(),
                UNIQUE(shop_id, product_id)
);
            `);

		await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_logs     (
                id SERIAL PRIMARY KEY,
                shop_id INT REFERENCES shop(id) NOT NULL,
                action_type VARCHAR(50) NOT NULL,   -- 'restock' | 'sell' | 'payment' | 'product_add'
                entity_type VARCHAR(50) NOT NULL,   -- 'restock_session' | 'order' | 'customer'
                entity_id INT NOT NULL,             -- the id of the created row
                created_at TIMESTAMPTZ DEFAULT now()
);
            `);

		console.log("Database initialized successfully");
	} catch (error) {
		console.error("Database initialization failed:", error);
		process.exit(1);
	}
};
