import express from "express";
import supabase from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Get notifications for a user
router.get("/notifications", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization required" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_email", user.user.email)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }

    res.json({
      success: true,
      notifications: notifications || []
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark a notification as read
router.post("/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization required" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { error } = await supabase
      .from("notifications")
      .update({ 
        isRead: true,
        read_at: new Date().toISOString()
      })
      .eq("id", notificationId)
      .eq("recipient_email", user.user.email);

    if (error) {
      return res.status(500).json({ error: "Failed to mark notification as read" });
    }

    res.json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark all notifications as read
router.post("/notifications/read-all", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization required" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { error } = await supabase
      .from("notifications")
      .update({ 
        isRead: true,
        read_at: new Date().toISOString()
      })
      .eq("recipient_email", user.user.email)
      .eq("isRead", false);

    if (error) {
      return res.status(500).json({ error: "Failed to mark notifications as read" });
    }

    res.json({
      success: true,
      message: "All notifications marked as read"
    });

  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a notification
router.delete("/notifications/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization required" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("recipient_email", user.user.email);

    if (error) {
      return res.status(500).json({ error: "Failed to delete notification" });
    }

    res.json({
      success: true,
      message: "Notification deleted"
    });

  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create bulk notifications (for event updates)
router.post("/notifications/bulk", async (req, res) => {
  try {
    const { title, message, type, eventId, eventTitle, recipientEmails, actionUrl } = req.body;

    if (!title || !message || !type || !recipientEmails || !Array.isArray(recipientEmails)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create notifications for all recipients
    const notifications = recipientEmails.map(email => ({
      id: uuidv4(),
      title,
      message,
      type,
      eventId: eventId || null,
      eventTitle: eventTitle || null,
      actionUrl: actionUrl || null,
      recipient_email: email,
      isRead: false,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from("notifications")
      .insert(notifications);

    if (error) {
      console.error("Error creating bulk notifications:", error);
      return res.status(500).json({ error: "Failed to create notifications" });
    }

    res.json({
      success: true,
      message: `Successfully created ${notifications.length} notifications`
    });

  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a single notification
router.post("/notifications", async (req, res) => {
  try {
    const { title, message, type, eventId, eventTitle, recipientEmail, actionUrl } = req.body;

    if (!title || !message || !type || !recipientEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const notification = {
      id: uuidv4(),
      title,
      message,
      type,
      eventId: eventId || null,
      eventTitle: eventTitle || null,
      actionUrl: actionUrl || null,
      recipient_email: recipientEmail,
      isRead: false,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("notifications")
      .insert([notification]);

    if (error) {
      console.error("Error creating notification:", error);
      return res.status(500).json({ error: "Failed to create notification" });
    }

    res.json({
      success: true,
      notification,
      message: "Notification created successfully"
    });

  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;