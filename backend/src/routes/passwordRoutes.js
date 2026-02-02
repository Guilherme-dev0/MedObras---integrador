import { Router } from "express";
import { forgotPassword, resetPassword, forgotLicense, resetLicense } from "../controllers/passwordController.js";

const router = Router();

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/forgot-license", forgotLicense);
router.post("/reset-license", resetLicense);

export default router;
