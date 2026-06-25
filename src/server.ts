import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import config from "./config";
import { allRoutes } from "./routes/route";
import { authroute } from "./routes/auth";
import verifyToken from "./middleware/verifyToken";
import { initDB } from "./db";

const app = express();
const port = config.port;

// middlewares FIRST
app.use(express.json());
app.use(express.raw());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(cookieParser());
app.use(
	cors({
		origin: "http://localhost:5173", // 🔥 hardcoded → safest for now
		credentials: true,
	}),
);

// routes
app.use("/api/auth", authroute);
app.use(verifyToken); // Apply token verification to all routes below
app.use("/api/", allRoutes);

// test route
app.get("/", (req: Request, res: Response) => {
	res.status(200).json({
		message: "Server is running",
		project: "Karbaar",
	});
});

initDB();
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
