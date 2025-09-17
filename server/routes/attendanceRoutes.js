import express from "express";
import db from "../config/database.js";

const router = express.Router();

// Get participants for an event
router.get("/events/:eventId/participants", async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get event to verify it exists
    const eventStmt = db.prepare("SELECT created_by, title FROM events WHERE event_id = ?");
    const event = eventStmt.get(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Get registrations for the event
    const registrationsStmt = db.prepare(`
      SELECT 
        r.*,
        COALESCE(a.status, 'absent') as attendance_status,
        a.marked_at,
        a.marked_by
      FROM registrations r
      LEFT JOIN attendance_status a ON r.id = a.registration_id
      WHERE r.event_id = ?
      ORDER BY r.created_at DESC
    `);
    
    const registrations = registrationsStmt.all(eventId);

    // Format the response to match expected structure
    const participants = registrations.map(reg => {
      let participantData = {
        id: reg.id,
        registration_id: reg.registration_id,
        event_id: reg.event_id,
        registration_type: reg.registration_type,
        created_at: reg.created_at,
        attendance_status: reg.attendance_status,
        marked_at: reg.marked_at,
        marked_by: reg.marked_by
      };

      if (reg.registration_type === 'individual') {
        participantData.individual_name = reg.individual_name;
        participantData.individual_email = reg.individual_email;
        participantData.individual_register_number = reg.individual_register_number;
      } else {
        participantData.team_name = reg.team_name;
        participantData.team_leader_name = reg.team_leader_name;
        participantData.team_leader_email = reg.team_leader_email;
        participantData.team_leader_register_number = reg.team_leader_register_number;
        try {
          participantData.teammates = reg.teammates ? JSON.parse(reg.teammates) : [];
        } catch (e) {
          participantData.teammates = [];
        }
      }

      return participantData;
    });

    return res.json({
      event: { title: event.title },
      participants: participants
    });

  } catch (error) {
    console.error("Error fetching participants:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Mark attendance for participants
router.post("/events/:eventId/attendance", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { participantIds, status, markedBy = "admin" } = req.body;

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: "participantIds array is required" });
    }

    if (!["attended", "absent"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'attended' or 'absent'" });
    }

    // Verify event exists
    const eventStmt = db.prepare("SELECT id FROM events WHERE event_id = ?");
    const event = eventStmt.get(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const now = new Date().toISOString();
    let updatedCount = 0;

    // Use transaction for bulk updates
    const transaction = db.transaction(() => {
      const upsertStmt = db.prepare(`
        INSERT INTO attendance_status (registration_id, event_id, status, marked_at, marked_by)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(registration_id) DO UPDATE SET
          status = excluded.status,
          marked_at = excluded.marked_at,
          marked_by = excluded.marked_by
      `);

      for (const participantId of participantIds) {
        try {
          upsertStmt.run(participantId, eventId, status, now, markedBy);
          updatedCount++;
        } catch (error) {
          console.error(`Error updating attendance for participant ${participantId}:`, error);
        }
      }
    });

    transaction();

    return res.json({
      message: `Attendance updated for ${updatedCount} participants`,
      updated_count: updatedCount
    });

  } catch (error) {
    console.error("Error marking attendance:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;