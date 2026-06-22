import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/hlw", (req: Request, res: Response) => {
	res.status(200).json({
		message: "Hello from the route!",
	});
});

export const allRoutes = router;