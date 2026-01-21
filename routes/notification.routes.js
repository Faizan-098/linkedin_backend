import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { clearNotifications, deleteNotification, getNotifications } from "../controllers/notification.controller.js";
const notificationRouter = express.Router();
notificationRouter.get('/getNotification',isAuth,getNotifications);
notificationRouter.delete('/deleteOneNotification/:id',isAuth,deleteNotification);
notificationRouter.delete('/deleteAllNotification',isAuth,clearNotifications);
export default notificationRouter;  