import express, { Router } from "express"
import { login, logout, signUp } from "../controllers/auth.controller.js";
const authRouter = express.Router();
// Signup Route
authRouter.post("/signup",signUp);

// Login Route
authRouter.post("/login",login)

// Logout Route
authRouter.get("/logout",logout)



export default authRouter;