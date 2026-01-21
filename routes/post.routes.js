import express from "express"
import { comment, createPost, getAllPosts, like } from "../controllers/post.controller.js";
import upload from "../middlewares/multer.js"
import isAuth from "../middlewares/isAuth.js";
const postRouter = express.Router();

// create post route
postRouter.post("/createPost",isAuth,upload.single("postImage") ,createPost);
postRouter.get("/getAllPosts",isAuth,getAllPosts)
postRouter.get("/like/:id",isAuth,like)
postRouter.post("/comment/:id",isAuth,comment)
export default postRouter