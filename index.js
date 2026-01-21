import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDb from "./config/db.js";

// Routes
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import connectionRouter from "./routes/connection.routes.js";
import notificationRouter from "./routes/notification.routes.js";

// Env config
dotenv.config();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// App setup
const app = express();
const server = http.createServer(app);
app.set("trust proxy", 1); // Add this line!

// Socket.io setup
export const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

// Store online users
export const userSocketMap = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected: ", socket.id);

  socket.on("register", (userId) => {
    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log("User registered: ", userSocketMap);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);

    // Remove user from map
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  });
});

// Global middlewares
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes middleware
app.use("/api/auth", authRouter);
app.use("/api/user/", userRouter);
app.use("/api/post/", postRouter);
app.use("/api/connection/", connectionRouter);
app.use("/api/notification/", notificationRouter);

await connectDb();

// Server start
server.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});
