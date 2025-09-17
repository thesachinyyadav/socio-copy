import express from "express";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

// Get participants for an event
router.get("/events/:eventId/participants", async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Verify the user is authorized (event creator or organizer)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization required" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get event to check if user is the creator
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("created_by, title")
      .eq("event_id", eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.created_by !== user.user.email) {
      return res.status(403).json({ error: "Not authorized to view participants for this event" });
    }

    // Get registrations for this event
    const { data: registrations, error: regError } = await supabase
      .from("registrations")
      .select(`
        *,
        attendance_status (
          status,
          marked_at,
          marked_by
        )
      `)
      .eq("event_id", eventId);

    if (regError) {
      return res.status(500).json({ error: "Failed to fetch participants" });
    }

    // Format participant data
    const participants = registrations.map(reg => ({
      id: reg.registration_id,
      name: reg.team_leader_name || reg.individual_name,
      email: reg.team_leader_email || reg.individual_email,
      registerNumber: reg.team_leader_register_number || reg.individual_register_number,
      teamName: reg.team_name,
      status: reg.attendance_status?.status || "registered",
      attendedAt: reg.attendance_status?.marked_at,
      markedBy: reg.attendance_status?.marked_by
    }));

    res.json({
      success: true,
      participants,
      eventTitle: event.title
    });

  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark attendance for a participant
router.post("/events/:eventId/attendance", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { participantId, status, markedBy } = req.body;

    if (!participantId || !status || !markedBy) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["attended", "absent"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Verify authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization required" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check if user is authorized for this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("created_by")
      .eq("event_id", eventId)
      .single();

    if (eventError || !event || event.created_by !== user.user.email) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Upsert attendance status
    const { error: attendanceError } = await supabase
      .from("attendance_status")
      .upsert({
        registration_id: participantId,
        event_id: eventId,
        status: status,
        marked_at: new Date().toISOString(),
        marked_by: markedBy
      }, {
        onConflict: "registration_id"
      });

    if (attendanceError) {
      return res.status(500).json({ error: "Failed to update attendance" });
    }

    res.json({
      success: true,
      message: "Attendance marked successfully"
    });

  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get attendance statistics for an event
router.get("/events/:eventId/attendance/stats", async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Verify authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization required" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get attendance statistics
    const { data: stats, error: statsError } = await supabase
      .from("registrations")
      .select(`
        registration_id,
        attendance_status (status)
      `)
      .eq("event_id", eventId);

    if (statsError) {
      return res.status(500).json({ error: "Failed to fetch attendance stats" });
    }

    const total = stats.length;
    const attended = stats.filter(s => s.attendance_status?.status === "attended").length;
    const absent = stats.filter(s => s.attendance_status?.status === "absent").length;
    const pending = total - attended - absent;

    res.json({
      success: true,
      stats: {
        total,
        attended,
        absent,
        pending,
        attendanceRate: total > 0 ? ((attended / total) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;