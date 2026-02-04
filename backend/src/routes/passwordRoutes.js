import { Router } from "express";
import { forgotPassword, resetPassword, forgotLicense } from "../controllers/passwordController.js";

const router = Router();

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/forgot-license", forgotLicense);

export default router;
