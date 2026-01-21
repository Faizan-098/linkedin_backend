import { connections } from "mongoose";
import uploadOnCloudinary from "../config/cloudinary.js";
import User from "../models/user.model.js";
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get-CurrentUser controller error:", error?.message);
    return res
      .status(500)
      .json({ message: "Get-CurrentUser internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const { firstName, lastName, userName, gender, location, headline } =
      req.body;

    // Required fields validation
    if (!firstName?.trim() || !lastName?.trim() || !userName?.trim()) {
      return res.status(400).json({
        message: "First name, last name and username are required",
      });
    }

    // parse array fields
    const parseJSON = (field) => {
      try {
        return field ? JSON.parse(field) : [];
      } catch {
        return [];
      }
    };

    const updateProfileData = {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      userName: userName?.trim(),
      gender: gender && gender?.trim(),
      location: location && location?.trim(),
      headline: headline && headline?.trim(),
      skills: parseJSON(req.body?.skills),
      education: parseJSON(req.body?.education),
      experience: parseJSON(req.body?.experience),
    };

    // Upload images if provided
    if (req.files?.profileImage?.[0]) {
      updateProfileData.profileImage = await uploadOnCloudinary(
        req.files.profileImage[0].path,
      );
    }

    if (req.files?.coverImage?.[0]) {
      updateProfileData.coverImage = await uploadOnCloudinary(
        req.files.coverImage[0].path,
      );
    }

    const user = await User.findByIdAndUpdate(userId, updateProfileData, {
      new: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Update-profile controller error: ", error);
    return res
      .status(500)
      .json({ message: "Update profile internal server error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { userName } = req.params;

    if (!userName?.trim()) {
      return res.status(400).json({ message: "Username is required" });
    }

    const user = await User.findOne({ userName: userName.trim() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get-UserProfile controller error:", error);
    return res
      .status(500)
      .json({ message: "User profile internal server error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query not found" });
    }

    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { userName: { $regex: query, $options: "i" } },
        { skills: { $in: [query] } },
      ],
    });

    
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Search Error" });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId).select("connections");
    const suggestedUsers = await User.find({
      _id: { $ne: req.userId, $nin: currentUser.connections },
    });
    return res.status(200).json({ suggestedUsers });
  } catch (error) {
    return res.status(500).json({ message: "Get Suggested Users Error" });
  }
};
