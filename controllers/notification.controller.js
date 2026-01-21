import Notification from "../models/notification.model.js"
export const getNotifications=async(req,res)=>{
    try {
        const notifications = await Notification.find({receiver:req.userId})
        .populate("relatedUser","firstName lastName headline profileImage")
        .populate("relatedPost","postImage description")
       return res.status(200).json({notifications});
    } catch (error) {
        return res.status(200).json({message:"get notification error"});
        
    }
}

export const deleteNotification=async(req,res)=>{
    try {
        const {id}=req.params;
        const deleteNoti=await Notification.findByIdAndDelete(id)
       return res.status(200).json({message:"Notification deleted successfully!"});
    } catch (error) {
        return res.status(200).json({message:"delete notification error"});
        
    }
}

export const clearNotifications =async(req,res)=>{
    try {
        const deleteAllNoti=await Notification.deleteMany({receiver:req.userId})
       return res.status(200).json({message:"All notifications deleted successfully!"});
    } catch (error) {
        return res.status(200).json({message:"delete all notification error"});
        
    }
}