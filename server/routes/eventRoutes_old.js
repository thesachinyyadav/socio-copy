import express from "express";
import supabase from "../config/supabaseClient.js";
import { multerUpload } from "../utils/multerConfig.js";
import {
  uploadFileToSupabase,
  getPathFromStorageUrl,
} from "../utils/fileUtils.js";
import {
  parseOptionalFloat,
  parseOptionalInt,
  parseJsonField,
} from "../utils/parsers.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error);
      return res
        .status(500)
        .json({ error: "Error fetching events from database." });
    }
    return res.status(200).json({ events: events || [] });
  } catch (error) {
    console.error("Server error GET /api/events:", error);
    return res
      .status(500)
      .json({ error: "Internal server error while fetching events." });
  }
});

router.post(
  "/",
  multerUpload.fields([
    { name: "imageFile", maxCount: 1 },
    { name: "bannerFile", maxCount: 1 },
    { name: "pdfFile", maxCount: 1 },
  ]),
  async (req, res) => {
    const uploadedFilePaths = {
      image: null,
      banner: null,
      pdf: null,
    };
    let generatedEventId = null;

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No token provided" });
      }
      const token = authHeader.split(" ")[1];
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !authUser) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      const { data: appUser, error: appUserError } = await supabase
        .from("users")
        .select("id, is_organiser, email")
        .eq("email", authUser.email)
        .single();

      if (appUserError || !appUser || !appUser.id) {
        console.error(
          "App user fetch error for POST /api/events:",
          appUserError
        );
        return res.status(403).json({
          error:
            "Forbidden: User not found or profile incomplete for event creation.",
        });
      }

      if (!appUser.is_organiser) {
        return res
          .status(403)
          .json({ error: "Forbidden: User is not an organizer" });
      }

      const files = req.files;
      const eventData = req.body;

      if (!eventData.eventTitle || String(eventData.eventTitle).trim() === "") {
        return res
          .status(400)
          .json({ error: "Event title is required to generate an event ID." });
      }
      generatedEventId = String(eventData.eventTitle)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      if (!generatedEventId) {
        return res.status(400).json({
          error: "Valid event title required to generate a unique event ID.",
        });
      }

      let event_image_url = null;
      let banner_url = null;
      let pdf_url = null;

      if (files && files.imageFile && files.imageFile[0]) {
        const result = await uploadFileToSupabase(
          files.imageFile[0],
          "event-images",
          generatedEventId
        );
        event_image_url = result.publicUrl;
        uploadedFilePaths.image = { path: result.path, bucket: "event-images" };
      }
      if (files && files.bannerFile && files.bannerFile[0]) {
        const result = await uploadFileToSupabase(
          files.bannerFile[0],
          "event-banners",
          generatedEventId
        );
        banner_url = result.publicUrl;
        uploadedFilePaths.banner = {
          path: result.path,
          bucket: "event-banners",
        };
      }
      if (files && files.pdfFile && files.pdfFile[0]) {
        const result = await uploadFileToSupabase(
          files.pdfFile[0],
          "event-pdfs",
          generatedEventId
        );
        pdf_url = result.publicUrl;
        uploadedFilePaths.pdf = { path: result.path, bucket: "event-pdfs" };
      }

      let organizerPhoneForDb = null;
      if (
        eventData.contactPhone &&
        String(eventData.contactPhone).trim() !== ""
      ) {
        const cleanedPhone = String(eventData.contactPhone).replace(/\D/g, "");
        if (cleanedPhone.length > 0 && cleanedPhone.length < 20) {
          organizerPhoneForDb = cleanedPhone;
        } else if (cleanedPhone.length >= 20) {
          for (const key in uploadedFilePaths) {
            if (uploadedFilePaths[key]) {
              await supabase.storage
                .from(uploadedFilePaths[key].bucket)
                .remove([uploadedFilePaths[key].path]);
            }
          }
          return res
            .status(400)
            .json({ error: "Contact phone number is too long." });
        }
      }

      const organizingDept = eventData.organizingDept;

      const eventPayload = {
        event_id: generatedEventId,
        title: eventData.eventTitle,
        description: eventData.detailedDescription,
        event_date: eventData.eventDate || null,
        end_date: eventData.endDate || null,
        event_time: eventData.eventTime || null,
        category: eventData.category,
        organizing_dept: organizingDept,
        department_access: parseJsonField(eventData.department, []),
        fest:
          eventData.festEvent === "none" ? null : eventData.festEvent || null,
        registration_deadline: eventData.registrationDeadline || null,
        venue: eventData.location,
        registration_fee: parseOptionalFloat(eventData.registrationFee),
        participants_per_team: parseOptionalInt(eventData.maxParticipants),
        organizer_email: eventData.contactEmail,
        organizer_phone: organizerPhoneForDb,
        whatsapp_invite_link: eventData.whatsappLink || null,
        claims_applicable: eventData.provideClaims === "true",
        schedule: parseJsonField(eventData.scheduleItems, []),
        rules: parseJsonField(eventData.rules, []),
        prizes: parseJsonField(eventData.prizes, []),
        event_image_url: event_image_url,
        banner_url: banner_url,
        pdf_url: pdf_url,
        total_participants: 0,
        created_by: appUser.email,
      };

      const requiredDbFields = [
        "event_id",
        "title",
        "event_date",
        "category",
        "organizing_dept",
        "department_access",
        "registration_deadline",
        "venue",
        "organizer_email",
      ];
      for (const field of requiredDbFields) {
        const value = eventPayload[field];
        if (
          value === null ||
          value === undefined ||
          (typeof value === "string" && !value.trim()) ||
          (Array.isArray(value) && value.length === 0)
        ) {
          for (const key in uploadedFilePaths) {
            if (uploadedFilePaths[key]) {
              await supabase.storage
                .from(uploadedFilePaths[key].bucket)
                .remove([uploadedFilePaths[key].path]);
            }
          }
          return res
            .status(400)
            .json({ error: `Missing required event field: ${field}.` });
        }
      }

      if (
        eventData.registrationFee &&
        eventPayload.registration_fee === null &&
        String(eventData.registrationFee).trim() !== "" &&
        isNaN(parseFloat(eventData.registrationFee))
      ) {
        for (const key in uploadedFilePaths) {
          if (uploadedFilePaths[key]) {
            await supabase.storage
              .from(uploadedFilePaths[key].bucket)
              .remove([uploadedFilePaths[key].path]);
          }
        }
        return res.status(400).json({
          error: "Invalid registration fee format. Must be a number.",
        });
      }
      if (
        eventData.maxParticipants &&
        eventPayload.participants_per_team === null &&
        String(eventData.maxParticipants).trim() !== "" &&
        isNaN(parseInt(eventData.maxParticipants, 10))
      ) {
        for (const key in uploadedFilePaths) {
          if (uploadedFilePaths[key]) {
            await supabase.storage
              .from(uploadedFilePaths[key].bucket)
              .remove([uploadedFilePaths[key].path]);
          }
        }
        return res.status(400).json({
          error: "Invalid max participants format. Must be a whole number.",
        });
      }
      if (
        eventData.contactPhone &&
        String(eventData.contactPhone).trim() !== "" &&
        eventPayload.organizer_phone === null
      ) {
        const cleanedPhone = String(eventData.contactPhone).replace(/\D/g, "");
        if (
          cleanedPhone.length === 0 &&
          String(eventData.contactPhone).trim().length > 0
        ) {
          for (const key in uploadedFilePaths) {
            if (uploadedFilePaths[key]) {
              await supabase.storage
                .from(uploadedFilePaths[key].bucket)
                .remove([uploadedFilePaths[key].path]);
            }
          }
          return res
            .status(400)
            .json({ error: "Invalid characters in contact phone number." });
        }
      }

      const { data: newEvent, error: insertError } = await supabase
        .from("events")
        .insert(eventPayload)
        .select()
        .single();

      if (insertError) {
        console.error("Supabase event insert error:", insertError);
        for (const key in uploadedFilePaths) {
          if (uploadedFilePaths[key]) {
            await supabase.storage
              .from(uploadedFilePaths[key].bucket)
              .remove([uploadedFilePaths[key].path]);
          }
        }

        if (insertError.code === "23505") {
          return res.status(409).json({
            error: `Event creation failed: An event with a similar title (ID: ${generatedEventId}) might already exist. ${
              insertError.details || ""
            }`,
          });
        }
        if (insertError.code === "22P02") {
          return res.status(400).json({
            error: `Invalid data format for one of the fields: ${
              insertError.details || insertError.message
            }`,
          });
        }
        return res
          .status(500)
          .json({ error: `Error creating event: ${insertError.message}` });
      }

      return res
        .status(201)
        .json({ event: newEvent, message: "Event created successfully" });
    } catch (error) {
      if (generatedEventId) {
        for (const key in uploadedFilePaths) {
          if (uploadedFilePaths[key]) {
            supabase.storage
              .from(uploadedFilePaths[key].bucket)
              .remove([uploadedFilePaths[key].path])
              .catch((e) =>
                console.error(
                  `Rollback file deletion error for ${uploadedFilePaths[key].path}: ${e.message}`
                )
              );
          }
        }
      }
      return res
        .status(500)
        .json({ error: error.message || "Internal server error" });
    }
  }
);

router.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId || typeof eventId !== "string" || eventId.trim() === "") {
      return res.status(400).json({
        error:
          "Event ID must be provided in the URL path and be a non-empty string.",
      });
    }

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching event by ID '${eventId}':`, error);
      return res
        .status(500)
        .json({ error: "Error fetching event from database." });
    }

    if (!event) {
      return res
        .status(404)
        .json({ error: `Event with ID '${eventId}' not found.` });
    }

    return res.status(200).json({ event });
  } catch (error) {
    console.error(`Server error GET /api/events/${req.params.eventId}:`, error);
    return res
      .status(500)
      .json({ error: "Internal server error while fetching specific event." });
  }
});

router.delete("/:eventId", async (req, res) => {
  const { eventId } = req.params;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const { data: appUser, error: appUserError } = await supabase
      .from("users")
      .select("id, email, is_organiser")
      .eq("email", authUser.email)
      .single();

    if (appUserError || !appUser) {
      return res
        .status(403)
        .json({ error: "Forbidden: User profile not found or incomplete." });
    }

    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("event_id, created_by, event_image_url, banner_url, pdf_url")
      .eq("event_id", eventId)
      .single();

    if (fetchError || !existingEvent) {
      if (fetchError?.code === "PGRST116" || !existingEvent) {
        return res
          .status(404)
          .json({ error: `Event with ID '${eventId}' not found.` });
      }
      return res
        .status(500)
        .json({ error: "Failed to retrieve existing event data." });
    }

    const isCreator = existingEvent.created_by === appUser.email;
    const isAuthorizedOrganizer = appUser.is_organiser === true;

    if (!(isCreator && isAuthorizedOrganizer)) {
      return res.status(403).json({
        error: "Forbidden: You are not authorized to delete this event.",
      });
    }

    const filesToDelete = [];
    if (existingEvent.event_image_url) {
      const path = getPathFromStorageUrl(
        existingEvent.event_image_url,
        "event-images"
      );
      if (path) filesToDelete.push({ bucket: "event-images", path });
    }
    if (existingEvent.banner_url) {
      const path = getPathFromStorageUrl(
        existingEvent.banner_url,
        "event-banners"
      );
      if (path) filesToDelete.push({ bucket: "event-banners", path });
    }
    if (existingEvent.pdf_url) {
      const path = getPathFromStorageUrl(existingEvent.pdf_url, "event-pdfs");
      if (path) filesToDelete.push({ bucket: "event-pdfs", path });
    }

    const { error: deleteDbError } = await supabase
      .from("events")
      .delete()
      .eq("event_id", eventId);

    if (deleteDbError) {
      return res.status(500).json({
        error: `Error deleting event from database: ${deleteDbError.message}`,
      });
    }

    for (const file of filesToDelete) {
      await supabase.storage
        .from(file.bucket)
        .remove([file.path])
        .catch((e) =>
          console.warn(
            `Event record deleted, but failed to delete file ${file.path} from ${file.bucket}: ${e.message}`
          )
        );
    }

    const { error: deleteRegistrationsError } = await supabase
      .from("event_registrations")
      .delete()
      .eq("event_id", eventId);

    if (deleteRegistrationsError) {
      console.warn(
        `Event deleted, but failed to delete associated registrations for event ${eventId}: ${deleteRegistrationsError.message}`
      );
    }

    return res.status(200).json({
      message: "Event and associated registrations deleted successfully.",
    });
  } catch (error) {
    console.error(`Overall error DELETE /api/events/${eventId}:`, error);
    return res.status(500).json({
      error: error.message || "Internal server error while deleting event.",
    });
  }
});

router.post("/:eventIdSlug/close", async (req, res) => {
  const { eventIdSlug } = req.params;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const { data: appUser, error: appUserError } = await supabase
      .from("users")
      .select("id, email, is_organiser")
      .eq("email", authUser.email)
      .single();

    if (appUserError || !appUser) {
      console.error(
        "App user fetch error for POST /api/events/:eventIdSlug/close:",
        appUserError
      );
      return res
        .status(403)
        .json({ error: "Forbidden: User profile not found or incomplete." });
    }

    if (!appUser.is_organiser) {
      return res
        .status(403)
        .json({ error: "Forbidden: User is not an organizer." });
    }

    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("created_by, event_id")
      .eq("event_id", eventIdSlug)
      .single();

    if (fetchError || !existingEvent) {
      if (fetchError?.code === "PGRST116" || !existingEvent) {
        return res
          .status(404)
          .json({ error: `Event with ID '${eventIdSlug}' not found.` });
      }
      console.error(
        `Error fetching event '${eventIdSlug}' for closing registration:`,
        fetchError
      );
      return res.status(500).json({
        error: "Failed to retrieve event data for closing registration.",
      });
    }

    if (existingEvent.created_by !== appUser.email) {
      return res.status(403).json({
        error:
          "Forbidden: You are not authorized to close registration for this event.",
      });
    }

    const newDeadline = new Date(Date.now() - 1000).toISOString();

    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update({
        registration_deadline: newDeadline,
        updated_at: new Date().toISOString(),
        updated_by: appUser.email,
      })
      .eq("event_id", eventIdSlug)
      .select("event_id, title, registration_deadline")
      .single();

    if (updateError) {
      console.error(
        `Failed to update registration deadline for event '${eventIdSlug}':`,
        updateError
      );
      return res.status(500).json({ error: "Failed to close registration." });
    }

    return res.status(200).json({
      message: "Registration closed successfully.",
      event: updatedEvent,
    });
  } catch (error) {
    console.error(
      `Overall error POST /api/events/${eventIdSlug}/close:`,
      error
    );
    return res.status(500).json({
      error:
        error.message || "Internal server error while closing registration.",
    });
  }
});

router.put(
  "/:eventId",
  multerUpload.fields([
    { name: "imageFile", maxCount: 1 },
    { name: "bannerFile", maxCount: 1 },
    { name: "pdfFile", maxCount: 1 },
  ]),
  async (req, res) => {
    const { eventId } = req.params;
    const files = req.files || {};
    const body = req.body;

    const uploadedFileRegistry = {
      image: null,
      banner: null,
      pdf: null,
    };

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No token provided" });
      }
      const token = authHeader.split(" ")[1];

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !authUser) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      const { data: appUser, error: appUserError } = await supabase
        .from("users")
        .select("id, email, is_organiser")
        .eq("email", authUser.email)
        .single();

      if (appUserError || !appUser) {
        console.error(
          "App user fetch error for PUT /api/events:",
          appUserError,
          "Auth User Email:",
          authUser.email
        );
        return res
          .status(403)
          .json({ error: "Forbidden: User profile not found or incomplete." });
      }

      if (!appUser.is_organiser) {
        return res
          .status(403)
          .json({ error: "Forbidden: User is not an organizer." });
      }

      const { data: existingEvent, error: fetchError } = await supabase
        .from("events")
        .select(
          "event_image_url, banner_url, pdf_url, created_by, event_id, title, event_date, end_date, event_time, description, category, organizing_dept, fest, registration_deadline, venue, organizer_email, registration_fee, participants_per_team, organizer_phone, whatsapp_invite_link, claims_applicable, department_access, schedule, rules, prizes"
        )
        .eq("event_id", eventId)
        .single();

      if (fetchError || !existingEvent) {
        if (fetchError?.code === "PGRST116" || !existingEvent) {
          return res
            .status(404)
            .json({ error: `Event with ID '${eventId}' not found.` });
        }
        console.error("Error fetching existing event for update:", fetchError);
        return res
          .status(500)
          .json({ error: "Failed to retrieve existing event data." });
      }

      if (existingEvent.created_by !== appUser.email) {
        return res.status(403).json({
          error: "Forbidden: You are not authorized to update this event.",
        });
      }

      const updatePayload = {};

      const fileFieldsToProcess = [
        {
          formKey: "imageFile",
          dbKey: "event_image_url",
          bucket: "event-images",
          registryKey: "image",
        },
        {
          formKey: "bannerFile",
          dbKey: "banner_url",
          bucket: "event-banners",
          registryKey: "banner",
        },
        {
          formKey: "pdfFile",
          dbKey: "pdf_url",
          bucket: "event-pdfs",
          registryKey: "pdf",
        },
      ];

      for (const field of fileFieldsToProcess) {
        const newFile = files[field.formKey]?.[0];
        const formSpecifiedUrl =
          body[
            `existing${
              field.formKey.charAt(0).toUpperCase() + field.formKey.slice(1)
            }Url`
          ] || null;
        const currentDbUrl = existingEvent[field.dbKey];
        let finalUrl = currentDbUrl;

        if (newFile) {
          const { publicUrl, path: newPath } = await uploadFileToSupabase(
            newFile,
            field.bucket,
            existingEvent.event_id
          );
          finalUrl = publicUrl;
          uploadedFileRegistry[field.registryKey] = {
            path: newPath,
            bucket: field.bucket,
          };

          if (currentDbUrl && currentDbUrl !== publicUrl) {
            const oldPath = getPathFromStorageUrl(currentDbUrl, field.bucket);
            if (oldPath)
              await supabase.storage
                .from(field.bucket)
                .remove([oldPath])
                .catch((e) =>
                  console.warn(
                    `Non-critical: Failed to delete old file ${oldPath} from ${field.bucket}: ${e.message}`
                  )
                );
          }
        } else {
          if (formSpecifiedUrl === null && currentDbUrl) {
            finalUrl = null;
            const oldPath = getPathFromStorageUrl(currentDbUrl, field.bucket);
            if (oldPath)
              await supabase.storage
                .from(field.bucket)
                .remove([oldPath])
                .catch((e) =>
                  console.warn(
                    `Non-critical: Failed to delete file ${oldPath} from ${field.bucket} on clear: ${e.message}`
                  )
                );
          } else if (formSpecifiedUrl !== currentDbUrl) {
            finalUrl = formSpecifiedUrl;
          }
        }
        if (finalUrl !== currentDbUrl) {
          updatePayload[field.dbKey] = finalUrl;
        }
      }

      if (
        body.eventTitle !== undefined &&
        body.eventTitle !== existingEvent.title
      )
        updatePayload.title = body.eventTitle;
      const eventDate = body.eventDate || null;
      if (eventDate !== existingEvent.event_date)
        updatePayload.event_date = eventDate;

      const endDate = body.endDate || null;
      if (endDate !== existingEvent.end_date) updatePayload.end_date = endDate;

      const eventTime = body.eventTime ? `${body.eventTime}:00` : null;
      if (eventTime !== existingEvent.event_time)
        updatePayload.event_time = eventTime;

      if (
        body.detailedDescription !== undefined &&
        body.detailedDescription !== existingEvent.description
      )
        updatePayload.description = body.detailedDescription;
      if (
        body.category !== undefined &&
        body.category !== existingEvent.category
      )
        updatePayload.category = body.category;

      const organizingDept = body.organizingDept || null;
      if (organizingDept !== existingEvent.organizing_dept)
        updatePayload.organizing_dept = organizingDept;

      const festEvent =
        body.festEvent === "none" ? null : body.festEvent || null;
      if (festEvent !== existingEvent.fest) updatePayload.fest = festEvent;

      const registrationDeadline = body.registrationDeadline || null;
      if (registrationDeadline !== existingEvent.registration_deadline)
        updatePayload.registration_deadline = registrationDeadline;

      if (body.location !== undefined && body.location !== existingEvent.venue)
        updatePayload.venue = body.location;
      if (
        body.contactEmail !== undefined &&
        body.contactEmail !== existingEvent.organizer_email
      )
        updatePayload.organizer_email = body.contactEmail;

      const registrationFee = parseOptionalFloat(body.registrationFee);
      if (registrationFee !== existingEvent.registration_fee)
        updatePayload.registration_fee = registrationFee;

      const maxParticipants = parseOptionalInt(body.maxParticipants);
      if (
        maxParticipants != 0 &&
        maxParticipants !== existingEvent.participants_per_team
      )
        updatePayload.participants_per_team = maxParticipants;

      const contactPhone = body.contactPhone
        ? String(body.contactPhone).replace(/\D/g, "")
        : null;
      if (contactPhone !== existingEvent.organizer_phone)
        updatePayload.organizer_phone = contactPhone || null;

      const whatsappLink = body.whatsappLink || null;
      if (whatsappLink !== existingEvent.whatsapp_invite_link)
        updatePayload.whatsapp_invite_link = whatsappLink;

      const provideClaims = body.provideClaims === "true";
      if (provideClaims !== existingEvent.claims_applicable)
        updatePayload.claims_applicable = provideClaims;

      const departmentAccess = parseJsonField(body.department, null);
      if (
        JSON.stringify(departmentAccess) !==
        JSON.stringify(existingEvent.department_access)
      )
        updatePayload.department_access = departmentAccess;

      const scheduleItems = parseJsonField(body.scheduleItems, null);
      if (
        JSON.stringify(scheduleItems) !== JSON.stringify(existingEvent.schedule)
      )
        updatePayload.schedule = scheduleItems;

      const rules = parseJsonField(body.rules, null);
      if (JSON.stringify(rules) !== JSON.stringify(existingEvent.rules))
        updatePayload.rules = rules;

      const prizes = parseJsonField(body.prizes, null);
      if (JSON.stringify(prizes) !== JSON.stringify(existingEvent.prizes))
        updatePayload.prizes = prizes;

      if (
        body.eventTitle !== undefined &&
        typeof body.eventTitle === "string" &&
        body.eventTitle.trim() !== "" &&
        existingEvent.event_id !==
          body.eventTitle
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
      ) {
        updatePayload.event_id = body.eventTitle
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
      }

      if (Object.keys(updatePayload).length === 0) {
        return res.status(200).json({
          message: "No changes detected to update.",
          event: existingEvent,
        });
      }

      updatePayload.updated_at = new Date().toISOString();
      updatePayload.updated_by = appUser.email;

      const { data: updatedEvent, error: updateError } = await supabase
        .from("events")
        .update(updatePayload)
        .eq("event_id", eventId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating event in Supabase:", updateError);
        for (const key of Object.keys(uploadedFileRegistry)) {
          if (uploadedFileRegistry[key]) {
            await supabase.storage
              .from(uploadedFileRegistry[key].bucket)
              .remove([uploadedFileRegistry[key].path])
              .catch((e) =>
                console.error(
                  `Rollback failed for ${uploadedFileRegistry[key].path}: ${e.message}`
                )
              );
          }
        }
        if (updateError.code === "23505" && updatePayload.event_id) {
          return res.status(409).json({
            error: `Failed to update event: The new event ID (slug) '${updatePayload.event_id}' likely conflicts with an existing event. ${updateError.message}`,
          });
        }
        return res
          .status(500)
          .json({ error: `Failed to update event: ${updateError.message}` });
      }

      return res
        .status(200)
        .json({ message: "Event updated successfully!", event: updatedEvent });
    } catch (error) {
      console.error("Overall error in PUT /api/events/:eventId :", error);
      for (const key of Object.keys(uploadedFileRegistry)) {
        if (uploadedFileRegistry[key]) {
          await supabase.storage
            .from(uploadedFileRegistry[key].bucket)
            .remove([uploadedFileRegistry[key].path])
            .catch((e) =>
              console.error(
                `Error during rollback of ${uploadedFileRegistry[key].path}: ${e.message}`
              )
            );
        }
      }
      return res.status(500).json({
        error: error.message || "An unexpected server error occurred.",
      });
    }
  }
);

export default router;
