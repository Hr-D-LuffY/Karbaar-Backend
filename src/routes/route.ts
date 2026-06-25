import { Router } from "express";
import type { Request, Response } from "express";
import {
	getAllCategories,
	getAllProducts,
	getProductInfo,

} from "../controller/productController";

const router = Router();

router.get("/hlw", (req: Request, res: Response) => {
	res.status(200).json({
		message: "Hello from the route!",
	});
});
router.get("/categories", getAllCategories);
router.get("/products", getAllProducts);
router.get("/products/options", getProductInfo);
export const allRoutes = router;
