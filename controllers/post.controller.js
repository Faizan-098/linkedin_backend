import uploadOnCloudinary from "../config/cloudinary.js";
import { io } from "../index.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";

// Create post
export const createPost = async (req, res) => {
  try {
    // userId
    const { userId } = req;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user!" });
    }

    const { description } = req.body;
    if (!description.trim()) {
      return res.status(400).json({ message: "Description is required!" });
    }

    const postData = {
      author: userId,
      description: description.trim(),
    };

    if (req.file) {
      postData.postImage = await uploadOnCloudinary(req.file?.path);
    }

    const post = await Post.create(postData);

    await post.populate("author", "firstName lastName headline profileImage ");
    return res.status(201).json({ post });
  } catch (error) {
    console.error("Create-post controller error =>", error);
    return res
      .status(500)
      .json({ message: "Create-post Internal Server Error" });
  }
};

// All posts
export const getAllPosts = async (req, res) => {
  try {
    const { userId } = req;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user!" });
    }
    const posts = await Post.find()
      .populate("author", "firstName lastName headline profileImage userName")
      .populate("comment.user", "firstName lastName headline profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Get-user-posts controller error =>", error);
    return res
      .status(500)
      .json({ message: "Get-user-posts Internal Server Error" });
  }
};

// Likes
export const like = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { userId } = req;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user!" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike
      post.likes.pull(userId);
    } else {
      // Like
      post.likes.push(userId);

      // Create notification only if not own post
      if (post.author.toString() !== userId.toString()) {
        await Notification.create({
          receiver: post.author,
          type: "like",
          relatedUser: userId,
          relatedPost: postId,
        });
      }
    }

    await post.save();

    // Emit real-time update
    io.emit("likeUpdated", {
      postId,
      likes: post.likes,
    });

    return res.status(201).json({ post });
  } catch (error) {
    console.error("Like controller error =>", error);
    return res.status(500).json({ message: "Like Internal Server Error!" });
  }
};

// Comments
export const comment = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { userId } = req;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user!" });
    }

    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required!" });
    }

    //Push comment in array
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comment: {
            content,
            user: userId,
          },
        },
      },
      { new: true },
    ).populate(
      "comment.user",
      "firstName lastName userName headline profileImage",
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }
    // Create notification only if not own post
    if (post.author.toString() !== userId.toString()) {
      await Notification.create({
        receiver: post.author,
        type: "comment",
        relatedUser: userId,
        relatedPost: postId,
      });
    }

    // Emit real-time update
    io.emit("commentAdded", { postId, comments: post.comment });
    return res.status(201).json({ post });
  } catch (error) {
    console.error("Comment controller error =>", error);
    return res.status(500).json({ message: "comment Internal Server Error!" });
  }
};
