import express from "express";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

router.get("/registrations", async (req, res) => {
  try {
    const { event_id } = req.query;
    if (!event_id || typeof event_id !== "string" || event_id.trim() === "") {
      return res
        .status(400)
        .json({ error: "Missing or invalid event_id parameter" });
    }

    const { data: registrations, error: regError } = await supabase
      .from("event_registrations")
      .select("register_number")
      .eq("event_id", event_id);

    if (regError) {
      console.error(
        `Database error fetching registrations for event ${event_id}:`,
        regError
      );
      return res.status(500).json({
        error: "Database error while fetching registrations.",
        details: regError.message,
      });
    }

    if (!registrations || registrations.length === 0) {
      return res.status(200).json({ users: [] });
    }

    const registerNumbers = [
      ...new Set(
        registrations.map((reg) => reg.register_number).filter(Boolean)
      ),
    ];

    if (registerNumbers.length === 0) {
      return res.status(200).json({ users: [] });
    }

    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, name, register_number, course, department, email")
      .in("register_number", registerNumbers);

    if (userError) {
      console.error(
        `Database error fetching user details for event ${event_id}:`,
        userError
      );
      return res.status(500).json({
        error: "Database error while fetching user details.",
        details: userError.message,
      });
    }

    return res.status(200).json({ users: users || [] });
  } catch (error) {
    console.error(
      `Unexpected error in /api/registrations for event ${req.query.event_id}:`,
      error
    );
    return res
      .status(500)
      .json({ error: "An unexpected internal server error occurred." });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { eventId, teamName, teammates } = req.body;

    if (
      !eventId ||
      !teammates ||
      !Array.isArray(teammates) ||
      teammates.length === 0
    ) {
      return res.status(400).json({
        error: "Missing required fields: eventId and teammates array.",
      });
    }

    const registrationsToInsert = teammates.map((teammate) => {
      if (
        !teammate.registerNumber ||
        typeof teammate.registerNumber !== "string" ||
        !/^\d{7}$/.test(teammate.registerNumber)
      ) {
        throw new Error(
          `Invalid or missing register number for a teammate: ${teammate.registerNumber}. Must be a 7-digit string.`
        );
      }
      const registerNumberInt = parseInt(teammate.registerNumber, 10);

      return {
        event_id: eventId,
        register_number: registerNumberInt,
        teamname: teamName || null,
      };
    });

    const { data, error } = await supabase
      .from("event_registrations")
      .insert(registrationsToInsert)
      .select();

    if (error) {
      console.error("Supabase registration insert error:", error);
      if (error.code === "23505") {
        return res.status(409).json({
          error:
            "One or more members are already registered for this event. Please check the registration numbers.",
          details: error.message,
        });
      }
      return res.status(500).json({
        error: "Failed to record registration. Please try again later.",
        details: error.message,
      });
    }

    return res.status(201).json({ message: "Registration successful!", data });
  } catch (error) {
    console.error("Error in /api/register-event:", error);
    if (error.message.includes("Invalid or missing register number")) {
      return res.status(400).json({ error: error.message });
    }
    return res
      .status(500)
      .json({ error: "Internal server error during registration." });
  }
});

router.get("/registrations/:registerNumber", async (req, res) => {
  try {
    const { registerNumber } = req.params;

    if (!registerNumber || !/^\d{7}$/.test(registerNumber)) {
      return res.status(400).json({ error: "Invalid register number format." });
    }

    const registerNumberInt = parseInt(registerNumber, 10);

    const { data, error } = await supabase
      .from("event_registrations")
      .select("event_id")
      .eq("register_number", registerNumberInt);

    if (error) {
      return res
        .status(500)
        .json({ error: "Failed to fetch user registrations." });
    }

    const eventIds = data ? data.map((reg) => reg.event_id) : [];
    return res.status(200).json({ registeredEventIds: eventIds });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/registrations/user/:registerNumber/events", async (req, res) => {
  try {
    const { registerNumber } = req.params;

    if (!registerNumber || !/^\d{7}$/.test(registerNumber)) {
      return res.status(400).json({
        error: "Invalid register number format. Must be a 7-digit string.",
      });
    }
    const registerNumberInt = parseInt(registerNumber, 10);

    const { data: registrations, error: regError } = await supabase
      .from("event_registrations")
      .select("event_id")
      .eq("register_number", registerNumberInt);

    if (regError) {
      console.error(
        `Error fetching registrations for user ${registerNumberInt}:`,
        regError.message
      );
      return res.status(500).json({
        error: "Failed to fetch user registrations.",
        details: regError.message,
      });
    }

    if (!registrations || registrations.length === 0) {
      return res.status(200).json({ events: [] });
    }

    const eventIds = registrations
      .map((reg) => reg.event_id)
      .filter((id) => id != null);
    if (eventIds.length === 0) {
      return res.status(200).json({ events: [] });
    }

    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("event_id, title, event_date, organizing_dept")
      .in("event_id", eventIds);

    if (eventsError) {
      console.error(
        `Error fetching event details for user ${registerNumberInt}:`,
        eventsError.message
      );
      return res.status(500).json({
        error: "Failed to fetch event details.",
        details: eventsError.message,
      });
    }

    const formattedEvents = (eventsData || []).map((event) => ({
      id: event.event_id,
      name: event.title,
      date: event.event_date,
      department: event.organizing_dept,
    }));

    return res.status(200).json({ events: formattedEvents });
  } catch (error) {
    console.error(
      `Error in /api/registrations/user/${req.params.registerNumber}/events:`,
      error.message
    );
    const message = error.message || "Internal server error.";
    return res.status(500).json({ error: message });
  }
});

export default router;
