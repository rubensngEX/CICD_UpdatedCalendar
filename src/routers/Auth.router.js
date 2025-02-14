const express = require("express");
const argon2 = require("argon2");
const router = express.Router();

// Middleware
const { comparePassword } = require("../middleware/argonMiddleware");
const { generateToken, sendToken } = require("../middleware/jwtMiddleware");
const { hashPassword } = require("../middleware/argonMiddleware");
const { retrieveByUsername } = require("../models/Person.model");
const { retrieveByEmail } = require("../models/Person.model");
const prisma = require("../models/prismaClient");

// Login Route
router.post(
  "/login",
  async (req, res, next) => {
    try {
      const { email, username, password } = req.body;

      // Validate input
      if (!password || (!email && !username)) {
        return res
          .status(400)
          .json({ message: "Email/Username and password are required" });
      }

      // Find user by email or username
      const user = email
        ? await retrieveByEmail(email) // Login by email
        : await retrieveByUsername(username); // Login by username

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Pass user data to next middleware
      res.locals.hash = user.password;
      res.locals.username = user.username;
      res.locals.personId = user.id;
      res.locals.role = user.role;

      // Proceed to password comparison middleware
      next();
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  comparePassword,
  generateToken,
  sendToken
);

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body; // Ensure password is destructured from req.body

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  try {
    // Check for existing email
    const existingEmail = await retrieveByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ message: "Email is already in use." });
    }

    // Check for existing username
    const existingUsername = await retrieveByUsername(name);
    if (existingUsername) {
      return res.status(409).json({ message: "Username is already in use." });
    }

    // Hash the password with Argon2
    const hashedPassword = await argon2.hash(password);

    // Create the user in the database
    const newUser = await prisma.person.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Respond with success message
    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;