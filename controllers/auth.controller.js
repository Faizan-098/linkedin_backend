import generateToken from "../config/token.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

// Signup controller
export const signUp = async (req, res) => {
  try {
    const { firstName, lastName, userName, password, email } = req.body;

    //  Check If any field is empty
    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !userName?.trim() ||
      !password ||
      !email?.trim()
    ) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Check If email exist in Db
    let isUserEmailExist = await User.findOne({ email });
    if (isUserEmailExist) {
      return res.status(400).json({ message: "Email is already exist!" });
    }

    // Check If userName exist in Db
    const isUserNameExist = await User.findOne({ userName });
    if (isUserNameExist) {
      return res.status(400).json({ message: "Username is already exist!" });
    }

    // Check Email Pattern
    const pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!pattern.test(email)) {
      return res.status(400).json({ message: "Invalid email!" });
    }

    // Check password length
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password length must be 8 characters or more!" });
    }

    // Hashed password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User In Db
    const user = await User.create({
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      userName: userName?.trim(),
      email: email?.trim(),
      password: hashedPassword,
    });

    // Generate Token
    const token = generateToken(user?._id);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENVIRONMENT == "production",
    });

    // Return response
    res.status(201).json({ user });
  } catch (error) {
    console.log(`Signup controller error => ${error}`);
    return res.status(500).json({ message: "Signup Internal Server Error!" });
  }
};

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //  Check If any field is empty
    if (!password || !email?.trim()) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Check If account exist or not
    const user = await User.findOne({ email }).select("+password");;
    if (!user) {
      return res.status(400).json({ message: "Acount does not exist!" });
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, user?.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Incorrect password!" });
    }

    // Generate Token
    const token = await generateToken(user?._id);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENVIRONMENT == "production",
    });

    // Return response
    res.status(200).json({ user });
  } catch (error) {
    console.log(`Login controller error => ${error}`);
    return res.status(500).json({ message: "Login Internal Server Error!" });
  }
};

// Logout controller
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENVIRONMENT == "production",
    });
    return res.status(200).json({ message: "Logout Successfully!" });
  } catch (error) {
    console.log(`Logout controller error => ${error}`);
    return res.status(500).json({ message: "Logout Internal Server Error!" });
  }
};
