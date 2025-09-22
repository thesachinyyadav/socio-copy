import express from "express";
import db from "../config/database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM users");
    const users = stmt.all();
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    const user = stmt.get(email);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { user: authClientUser } = req.body;
    if (!authClientUser || !authClientUser.email) {
      return res
        .status(400)
        .json({ error: "Invalid user data: email is required" });
    }

    // Check if user already exists by email or auth_uuid
    const checkStmt = db.prepare("SELECT * FROM users WHERE email = ? OR (auth_uuid IS NOT NULL AND auth_uuid = ?)");
    const existingUser = checkStmt.get(authClientUser.email, authClientUser.id);

    if (existingUser) {
      // If user exists but doesn't have auth_uuid, update it
      if (!existingUser.auth_uuid && authClientUser.id) {
        const updateStmt = db.prepare("UPDATE users SET auth_uuid = ? WHERE email = ?");
        updateStmt.run(authClientUser.id, authClientUser.email);
        
        // Get updated user
        const getUpdatedStmt = db.prepare("SELECT * FROM users WHERE email = ?");
        const updatedUser = getUpdatedStmt.get(authClientUser.email);
        
        return res.status(200).json({
          user: updatedUser,
          isNew: false,
          message: "User updated with auth UUID.",
        });
      }
      
      return res.status(200).json({
        user: existingUser,
        isNew: false,
        message: "User already exists.",
      });
    }

    // Create new user
    let name = authClientUser.name || authClientUser.user_metadata?.full_name || "";
    let registerNumber = authClientUser.user_metadata?.register_number || "";
    if (name) {
      const nameParts = name.split(" ");
      if (nameParts.length > 1) {
        const lastPart = nameParts[nameParts.length - 1];
        if (/^\d+$/.test(lastPart) && !registerNumber) {
          registerNumber = lastPart;
          name = nameParts.slice(0, -1).join(" ");
        }
      }
    }

    const avatarUrl =
      authClientUser.user_metadata?.avatar_url ||
      authClientUser.user_metadata?.picture ||
      authClientUser.avatar_url ||
      authClientUser.picture ||
      null;

    const insertStmt = db.prepare(`
      INSERT INTO users (auth_uuid, email, name, avatar_url, is_organiser, course)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      authClientUser.id || null,
      authClientUser.email,
      name || "New User",
      avatarUrl,
      0, // SQLite uses 0/1 for boolean
      null
    );

    // Get the newly created user
    const getStmt = db.prepare("SELECT * FROM users WHERE email = ?");
    const newUser = getStmt.get(authClientUser.email);

    return res.status(201).json({
      user: newUser,
      isNew: true,
      message: "User created successfully.",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;