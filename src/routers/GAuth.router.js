const { OAuth2Client } = require("google-auth-library");
const express = require("express");

const router = express.Router();
const client = new OAuth2Client("376351528756-ebdag50v6elarsj2adgmch4mdf6ob116.apps.googleusercontent.com");
const { generateToken, sendToken } = require("../middleware/jwtMiddleware");
const { createPerson, getPersonByGId } = require("../models/Person.model");

router.post("/google/callback", async (req, res, next) => {
    try {
        const { idToken } = req.body;
        console.log("Received ID Token:", idToken); // Debugging log
        if (!idToken) return res.status(400).json({ message: "No token provided" });

        // Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: "376351528756-ebdag50v6elarsj2adgmch4mdf6ob116.apps.googleusercontent.com"
        });

        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name;

        // Check if user exists in the database
        let user;
        try {
            user = await getPersonByGId(googleId);
            console.log("User found:", user);
        } catch (dbError) {
            console.error("Error fetching user:", dbError);
        }

        // If user doesn't exist, create a new one
        if (!user) {
            user = await createPerson(googleId, email, name, "1213");
            console.log("New user created:", user);
        }

        // Store user info in locals
        res.locals.username = user.name;
        res.locals.personId = user.id;
        next();
    } catch (err) {
        console.error("Authentication Error:", err);
        res.status(401).json({ message: "Authentication failed" });
    }
}, generateToken, sendToken);

module.exports = router;
