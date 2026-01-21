import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { getCurrentUser, getSuggestedUsers, getUserProfile, searchUsers, updateProfile } from "../controllers/user.controller.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

// current user route
userRouter.get("/currentUser", isAuth, getCurrentUser);

userRouter.put("/updateProfile",isAuth,upload.fields([
    {name:"profileImage",maxCount:1}, {name:"coverImage",maxCount:1}
]),updateProfile)

userRouter.get('/getUserProfile/:userName',isAuth,getUserProfile)

userRouter.get('/search',isAuth,searchUsers);
userRouter.get('/getSuggestedUsers',isAuth,getSuggestedUsers);
export default userRouter; 