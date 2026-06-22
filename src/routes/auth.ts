import { Router } from "express";
import { getMe, Login, Logout } from "../controller/authController";
import verifyToken from "../middleware/verifyToken";

const router = Router();

router.post("/login", Login);
router.post("/logout", Logout);
router.get("/me", verifyToken, getMe);

export const authroute = router;
