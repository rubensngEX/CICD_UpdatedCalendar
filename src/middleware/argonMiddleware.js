const argon2 = require("argon2");

// Middleware to hash password
module.exports.hashPassword = async function (req, res, next) {
    const { password } = req.body;

    // Validate password
    if (!password) {
        return res.status(400).json({ message: "Password is required." });
    }

    try {
        // Hash the password using Argon2
        const hash = await argon2.hash(password);

        // Store the hash in `res.locals` for the next middleware/route
        res.locals.hash = hash;
        next();
    } catch (err) {
        console.error("Error hashing password with Argon2:", err);
        res.status(500).json({ message: "Error hashing password." });
    }
};

// Middleware to verify password
module.exports.comparePassword = async function (req, res, next) {
    const { password } = req.body;
    const hash = res.locals.hash || req.hash; // Pass hash from previous middleware or route

    // Validate inputs
    if (!password || !hash) {
        return res.status(400).json({ message: "Password and hash are required." });
    }

    try {
        // Verify the password
        const isValid = await argon2.verify(hash, password);

        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        next(); // Password is valid, proceed to the next middleware/route
    } catch (err) {
        console.error("Error verifying password with Argon2:", err);
        res.status(500).json({ message: "Error verifying password." });
    }
};

module.exports.hashPasswordWithParameters = async function (password) {
    try {
      const hash = await argon2.hash(password);
      return hash;
    } catch (err) {
      console.error("Error in argon2.hash:", err);
      throw new Error("Failed to hash password");
    }
};
  
module.exports.comparePasswordWithParameters = async function (
    plainPassword,
    hashedPassword
  ) {
    try {
      const isMatch = await argon2.verify(hashedPassword, plainPassword);
      if (!isMatch) {
        throw new Error("Wrong password");
      }
      return true; // Password matches
    } catch (err) {
      console.error("Error in argon2.verify:", err);
      throw err;
    }
};