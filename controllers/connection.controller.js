import Connection from "../models/connection.model.js";
import User from "../models/user.model.js";
import { io, userSocketMap } from "../index.js";
import Notification from "../models/notification.model.js";

export const sendConnection = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.userId;

    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized user!" });
    }

    // Prevent self request
    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "You cannot connect with yourself!" });
    }

    // Check sender exists
    const senderUser = await User.findById(senderId);
    if (!senderUser) {
      return res.status(404).json({ message: "Sender not found!" });
    }

    // Already connected
    if (senderUser.connections.includes(receiverId)) {
      return res.status(400).json({ message: "Already connected!" });
    }

    // Pending request already exists
    const existingRequest = await Connection.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Connection request already sent!" });
    }

    // Create new connection request
    const connection = await Connection.create({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    // Real-time socket updates
    const receiverSocketId = userSocketMap.get(receiverId);
    const senderSocketId = userSocketMap.get(senderId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("statusUpdate", {
        userId: senderId,
        newStatus: "received",
      });
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("statusUpdate", {
        userId: receiverId,
        newStatus: "pending",
      });
    }

    return res.status(201).json({ message: "Connection request sent!" });
  } catch (error) {
    console.error("Send-connection error =>", error);
    return res
      .status(500)
      .json({ message: "Send-connection Internal Server Error!" });
  }
};

export const acceptConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const currentUserId = req.userId;

    // Find connection
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    // Only pending requests can be accepted
    if (connection.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    //  Only receiver can accept
    if (connection.receiver.toString() !== currentUserId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update connection status
    connection.status = "accepted";
    await connection.save();

    // Add users to each other's connections
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { connections: connection.sender },
    });

    await User.findByIdAndUpdate(connection.sender, {
      $addToSet: { connections: currentUserId },
    });

    // Create notification
    await Notification.create({
      receiver: connection.sender,
      type: "connectionAccepted",
      relatedUser: currentUserId,
    });

    // Real-time socket update
    const receiverSocketId = userSocketMap.get(currentUserId);
    const senderSocketId = userSocketMap.get(connection.sender.toString());

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("statusUpdate", {
        userId: connection.sender,
        newStatus: "disconnect",
      });
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("statusUpdate", {
        userId: currentUserId,
        newStatus: "disconnect",
      });
    }

    return res.status(200).json({ message: "Connection accepted" });
  } catch (error) {
    console.error("Accept-connection controller error =>", error);
    return res
      .status(500)
      .json({ message: "Accept-connection server error" });
  }
};


export const rejectConnection = async (req, res) => {
  try {
   const { connectionId } = req.params;
    const currentUserId = req.userId;

    // Find connection
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    // Only pending requests can be accepted
    if (connection.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    //  Only receiver can accept
    if (connection.receiver.toString() !== currentUserId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update connection status
    await Connection.findByIdAndDelete(connectionId);
    
    // Get socket IDs for real-time update
    const senderSocketId = userSocketMap.get(connection.sender.toString());
    const receiverSocketId = userSocketMap.get(connection.receiver.toString());
    
    // Notify sender (connection was rejected)
    if (senderSocketId) {
      io.to(senderSocketId).emit("statusUpdate", {
        userId: connection.receiver.toString(),
        newStatus: "connect"
      });
    }

    // Notify receiver (request was rejected)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("statusUpdate", {
        userId: connection.sender.toString(),
        newStatus: "connect"
      });
    }

    return res.status(200).json({ message: "connection rejected" });
  } catch (error) {
    console.error("Reject-connection controllor error =>", error.message);
    return res.status(500).json({ message: "Reject-connection server error" });
  }
};

export const getConnectionStatus = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized user!" });
    }

    if (!targetUserId) {
      return res.status(400).json({ message: "Target user ID is required!" });
    }

    // Get current user
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found!" });
    }

    // Already connected
    if (currentUser.connections.includes(targetUserId)) {
      return res.status(200).json({ status: "disconnect" });
    }

    // Check pending connection (both directions)
    const pendingRequest = await Connection.findOne({
      status: "pending",
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
    });

    if (pendingRequest) {
      // Current user sent request
      if (pendingRequest.sender._id.toString() === currentUserId) {
        return res.status(200).json({ status: "pending" });
      }

      // Current user received request
      return res.status(200).json({ status: "received" });
    }

    // No connection at all
    return res.status(200).json({ status: "connect" });
  } catch (error) {
    console.log(`Get-connection-status controller error => ${error.message}`);
    return res
      .status(500)
      .json({ message: "Get-connection-status internal server error" });
  }
};

export const removeConnection = async (req, res) => {
  try {
    const myId = req.userId;
    const otherUserId = req.params.userId;
    await User.findByIdAndUpdate(myId, {
      $pull: {
        connections: otherUserId,
      },
    });

    await User.findByIdAndUpdate(otherUserId, {
      $pull: {
        connections: myId,
      },
    });

    const receiverSocketId = userSocketMap.get(otherUserId);
    const senderSocketId = userSocketMap.get(myId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("statusUpdate", {
        userId: myId,
        newStatus: "connect",
      });
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("statusUpdate", {
        userId: otherUserId,
        newStatus: "connect",
      });
    }

    return res.status(200).json({ message: "Connection removed Succesfully" });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ message: "removedConnection Internel Server Error" });
  }
};

export const getConnectionRequests = async (req, res) => {
  try {
    const { userId } = req;

    const requests = await Connection.find({
      receiver: userId,
      status: "pending",
    }).populate(
      "sender",
      "lastName firstName email userName headline profileImage"
    );
    return res.status(200).json({ requests });
  } catch (error) {
    console.log("GetConnections-requests controller error=>", error);
    return res
      .status(500)
      .json({ message: "getConnection Internel Server Error" });
  }
};

export const getUserConnections = async (req, res) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId).populate(
      "connections",
      "firstName lastName profileImage connections headline userName"
    );
    return res.status(200).json(user.connections);
  } catch (error) {
    console.log(error.message);

    return res
      .status(200)
      .json({ message: "getUserConnections Internel Server Error" });
  }
};
