import express from "express";
import db from "../config/database.js";
import { multerUpload } from "../utils/multerConfig.js";
import { uploadFileToSupabase, getPathFromStorageUrl, deleteFileFromLocal } from "../utils/fileUtils.js";
import { parseOptionalFloat, parseOptionalInt, parseJsonField } from "../utils/parsers.js";
import { v4 as uuidv4 } from "uuid";
import { 
  authenticateUser, 
  getUserInfo, 
  requireOrganiser, 
  requireOwnership, 
  optionalAuth 
} from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all events - PUBLIC ACCESS (no auth required)
router.get("/", async (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM events ORDER BY created_at DESC");
    const events = stmt.all();

    // Parse JSON fields for each event
    const processedEvents = events.map(event => ({
      ...event,
      department_access: event.department_access ? JSON.parse(event.department_access) : [],
      rules: event.rules ? JSON.parse(event.rules) : [],
      schedule: event.schedule ? JSON.parse(event.schedule) : [],
      prizes: event.prizes ? JSON.parse(event.prizes) : []
    }));

    return res.status(200).json({ events: processedEvents });
  } catch (error) {
    console.error("Server error GET /api/events:", error);
    return res.status(500).json({ error: "Internal server error while fetching events." });
  }
});

// GET specific event by ID - PUBLIC ACCESS
router.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId || typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        error: "Event ID must be provided in the URL path and be a non-empty string.",
      });
    }

    const stmt = db.prepare("SELECT * FROM events WHERE event_id = ?");
    const event = stmt.get(eventId);

    if (!event) {
      return res.status(404).json({ error: `Event with ID '${eventId}' not found.` });
    }

    // Parse JSON fields
    const processedEvent = {
      ...event,
      department_access: event.department_access ? JSON.parse(event.department_access) : [],
      rules: event.rules ? JSON.parse(event.rules) : [],
      schedule: event.schedule ? JSON.parse(event.schedule) : [],
      prizes: event.prizes ? JSON.parse(event.prizes) : []
    };

    return res.status(200).json({ event: processedEvent });
  } catch (error) {
    console.error("Server error GET /api/events/:eventId:", error);
    return res.status(500).json({ error: "Internal server error while fetching event." });
  }
});

// POST create new event - REQUIRES AUTHENTICATION + ORGANISER PRIVILEGES
router.post(
  "/",
  multerUpload.fields([
    { name: "imageFile", maxCount: 1 },
    { name: "bannerFile", maxCount: 1 },
    { name: "pdfFile", maxCount: 1 },
  ]),
  authenticateUser,           // Verify JWT token
  getUserInfo(db),           // Get user info from local DB
  requireOrganiser,          // Check if user is organiser
  async (req, res) => {
    const uploadedFilePaths = {
      image: null,
      banner: null,
      pdf: null,
    };

    try {
      const {
        title,
        description,
        event_date,
        event_time,
        venue,
        category,
        claims_applicable,
        registration_fee,
        organizing_dept,
        fest,
        department_access,
        rules,
        schedule,
        prizes,
        max_participants,
        tags
      } = req.body;

      // Validation
      if (!title || typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "Title is required and must be a non-empty string." });
      }

      // Generate event ID
      const event_id = uuidv4();

      // Handle file uploads
      const files = req.files;
      if (files.imageFile) {
        uploadedFilePaths.image = await uploadFileToSupabase(files.imageFile[0], "event-images", event_id);
      }
      if (files.bannerFile) {
        uploadedFilePaths.banner = await uploadFileToSupabase(files.bannerFile[0], "event-banners", event_id);
      }
      if (files.pdfFile) {
        uploadedFilePaths.pdf = await uploadFileToSupabase(files.pdfFile[0], "event-pdfs", event_id);
      }

      // Parse and validate JSON fields
      const parsedDepartmentAccess = parseJsonField(department_access, []);
      const parsedRules = parseJsonField(rules, []);
      const parsedSchedule = parseJsonField(schedule, []);
      const parsedPrizes = parseJsonField(prizes, []);
      const parsedTags = parseJsonField(tags, []);

      // Insert event with creator's auth_uuid
      const insertStmt = db.prepare(`
        INSERT INTO events (
          event_id, title, description, event_date, event_time, venue, category,
          claims_applicable, registration_fee, event_image_url, banner_url, pdf_url,
          organizing_dept, fest, department_access, rules, schedule, prizes,
          max_participants, tags, auth_uuid, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      const result = insertStmt.run(
        event_id,
        title.trim(),
        description || null,
        event_date || null,
        event_time || null,
        venue || null,
        category || null,
        claims_applicable === "true" || claims_applicable === true,
        parseOptionalFloat(registration_fee),
        uploadedFilePaths.image,
        uploadedFilePaths.banner,
        uploadedFilePaths.pdf,
        organizing_dept || null,
        fest || null,
        JSON.stringify(parsedDepartmentAccess),
        JSON.stringify(parsedRules),
        JSON.stringify(parsedSchedule),
        JSON.stringify(parsedPrizes),
        parseOptionalInt(max_participants),
        JSON.stringify(parsedTags),
        req.userId  // Creator's auth_uuid
      );

      if (result.changes === 0) {
        throw new Error("Event was not created successfully.");
      }

      return res.status(201).json({ 
        message: "Event created successfully", 
        event_id,
        created_by: req.userInfo.email 
      });

    } catch (error) {
      console.error("Server error POST /api/events:", error);
      
      // Clean up uploaded files on error
      try {
        for (const [key, filePath] of Object.entries(uploadedFilePaths)) {
          if (filePath) {
            await deleteFileFromLocal(getPathFromStorageUrl(filePath, `event-${key}s`), `event-${key}s`);
          }
        }
      } catch (cleanupError) {
        console.error("Error cleaning up files:", cleanupError);
      }

      return res.status(500).json({ error: "Internal server error while creating event." });
    }
  }
);

// PUT update event - REQUIRES AUTHENTICATION + OWNERSHIP + ORGANISER PRIVILEGES
router.put(
  "/:eventId",
  multerUpload.fields([
    { name: "imageFile", maxCount: 1 },
    { name: "bannerFile", maxCount: 1 },
    { name: "pdfFile", maxCount: 1 },
  ]),
  authenticateUser,
  getUserInfo(db),
  requireOrganiser,
  requireOwnership(db, 'events', 'eventId', 'auth_uuid'),  // Check ownership
  async (req, res) => {
    // Implementation similar to POST but with UPDATE logic
    // ... (truncated for brevity, but would include full update logic with ownership checks)
    res.status(501).json({ message: "Update endpoint - implementation needed" });
  }
);

// DELETE event - REQUIRES AUTHENTICATION + OWNERSHIP + ORGANISER PRIVILEGES  
router.delete(
  "/:eventId", 
  authenticateUser,
  getUserInfo(db),
  requireOrganiser,
  requireOwnership(db, 'events', 'eventId', 'auth_uuid'),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const event = req.resource; // From ownership middleware

      // Delete associated files
      const filesToDelete = [
        { url: event.event_image_url, bucket: "event-images" },
        { url: event.banner_url, bucket: "event-banners" },
        { url: event.pdf_url, bucket: "event-pdfs" }
      ];

      for (const fileInfo of filesToDelete) {
        if (fileInfo.url) {
          const filePath = getPathFromStorageUrl(fileInfo.url, fileInfo.bucket);
          if (filePath) {
            await deleteFileFromLocal(filePath, fileInfo.bucket);
          }
        }
      }

      // Delete related records (cascading delete)
      db.prepare("DELETE FROM attendance_status WHERE event_id = ?").run(eventId);
      db.prepare("DELETE FROM registrations WHERE event_id = ?").run(eventId);
      
      // Delete the event
      const deleteResult = db.prepare("DELETE FROM events WHERE event_id = ?").run(eventId);

      if (deleteResult.changes === 0) {
        return res.status(404).json({ error: "Event not found or already deleted." });
      }

      return res.status(200).json({ 
        message: "Event deleted successfully",
        deleted_by: req.userInfo.email 
      });

    } catch (error) {
      console.error("Server error DELETE /api/events/:eventId:", error);
      return res.status(500).json({ error: "Internal server error while deleting event." });
    }
  }
);

export default router;