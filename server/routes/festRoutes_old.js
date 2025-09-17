import express from "express";
import supabase from "../config/supabaseClient.js";
import { getPathFromStorageUrl } from "../utils/fileUtils.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { data: fests, error } = await supabase.from("fest").select("*");
    if (error) {
      return res
        .status(500)
        .json({ error: "Error fetching fests from database." });
    }
    return res.send({ fests: fests || [] });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal server error while fetching fests." });
  }
});

router.get("/:festId", async (req, res) => {
  try {
    const { festId: festSlug } = req.params;
    if (!festSlug || typeof festSlug !== "string" || festSlug.trim() === "") {
      return res.status(400).json({
        error:
          "Fest ID (slug) must be provided in the URL path and be a non-empty string.",
      });
    }
    const { data: fest, error } = await supabase
      .from("fest")
      .select("*")
      .eq("fest_id", festSlug)
      .maybeSingle();
    if (error) {
      return res
        .status(500)
        .json({ error: "Error fetching fest from database." });
    }
    if (!fest) {
      return res
        .status(404)
        .json({ error: `Fest with ID (slug) '${festSlug}' not found.` });
    }
    return res.status(200).json({ fest });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal server error while fetching specific fest." });
  }
});

router.post("/", async (req, res) => {
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
    const { data: appUserData, error: appUserError } = await supabase
      .from("users")
      .select("is_organiser, email")
      .eq("email", authUser.email)
      .single();
    if (appUserError || !appUserData) {
      console.error("App user fetch error for POST /api/fests:", appUserError);
      return res.status(403).json({
        error:
          "Forbidden: User profile not found or incomplete for fest creation.",
      });
    }
    if (!appUserData.is_organiser) {
      return res
        .status(403)
        .json({ error: "Forbidden: User is not an organizer." });
    }
    const {
      title,
      opening_date,
      closing_date,
      detailed_description,
      department,
      category,
      contact_email,
      contact_phone,
      event_heads,
      festImageUrl,
      organizing_dept,
    } = req.body;

    const missingFieldsList = [];
    if (!title || !title.trim()) missingFieldsList.push("title");
    if (!opening_date) missingFieldsList.push("opening_date");
    if (!closing_date) missingFieldsList.push("closing_date");
    if (!detailed_description || !detailed_description.trim())
      missingFieldsList.push("detailed_description");
    if (!department || !Array.isArray(department) || department.length === 0)
      missingFieldsList.push("department (for department_access)");
    if (!category || !category.trim()) missingFieldsList.push("category");
    if (!contact_email || !contact_email.trim())
      missingFieldsList.push("contact_email");
    if (!contact_phone || !String(contact_phone).trim())
      missingFieldsList.push("contact_phone");
    if (!festImageUrl || !String(festImageUrl).trim())
      missingFieldsList.push("festImageUrl");
    if (!organizing_dept || !String(organizing_dept).trim())
      missingFieldsList.push("organizing_dept");

    if (missingFieldsList.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFieldsList.join(", ")}.`,
      });
    }

    const processedContactPhone = String(contact_phone).trim()
      ? String(contact_phone).trim().replace(/\D/g, "")
      : null;

    const festDataToInsert = {
      fest_id: title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
      fest_title: title,
      opening_date,
      closing_date,
      description: detailed_description,
      department_access: department,
      category,
      contact_email,
      contact_phone: processedContactPhone,
      event_heads: event_heads || [],
      fest_image_url: festImageUrl,
      created_by: appUserData.email,
      organizing_dept: organizing_dept,
    };

    const { data: newFest, error: insertError } = await supabase
      .from("fest")
      .insert(festDataToInsert)
      .select()
      .single();

    if (insertError) {
      let sc = 500;
      let em = `Error creating fest: ${insertError.message}`;
      if (insertError.code === "23505") {
        sc = 409;
        em = `Fest creation failed: ${
          insertError.details ||
          "Similar fest may exist (check fest_id or title)."
        }`;
      } else if (
        insertError.code?.startsWith("23") ||
        insertError.code === "22P02"
      ) {
        sc = 400;
        em = `Fest creation failed: Invalid data. ${
          insertError.details || insertError.message
        }`;
      }
      return res.status(sc).json({ error: em });
    }
    return res
      .status(201)
      .json({ fest: newFest, message: "Fest created successfully." });
  } catch (error) {
    console.error("Overall error POST /api/fests:", error);
    return res
      .status(500)
      .json({ error: "Internal server error while creating fest." });
  }
});

router.put("/:festId", async (req, res) => {
  const { festId } = req.params;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res
        .status(401)
        .json({ error: "Unauthorized: No token provided." });
    const token = authHeader.split(" ")[1];
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser)
      return res.status(401).json({ error: "Unauthorized: Invalid token." });

    const { data: appUserData, error: appUserError } = await supabase
      .from("users")
      .select("is_organiser, email")
      .eq("email", authUser.email)
      .single();

    if (appUserError || !appUserData) {
      console.error("App user fetch error for PUT /api/fests:", appUserError);
      return res
        .status(403)
        .json({ error: "Forbidden: User profile issue for authorization." });
    }

    const { data: currentFest, error: fetchCurrentError } = await supabase
      .from("fest")
      .select("fest_image_url, created_by, fest_id")
      .eq("fest_id", festId)
      .single();

    if (fetchCurrentError) {
      if (fetchCurrentError.code === "PGRST116")
        return res.status(404).json({ error: "Fest not found." });
      return res
        .status(500)
        .json({ error: `Error fetching fest: ${fetchCurrentError.message}` });
    }

    const isCreator = currentFest.created_by === appUserData.email;
    const isAuthUserOrganizer = appUserData.is_organiser === true;

    if (!(isCreator && isAuthUserOrganizer)) {
      return res.status(403).json({
        error: "Forbidden: You are not authorized to update this fest.",
      });
    }

    const oldFestImageUrl = currentFest.fest_image_url;
    const {
      title,
      opening_date,
      closing_date,
      detailed_description,
      department,
      category,
      contact_email,
      contact_phone,
      event_heads,
      festImageUrl,
      organizing_dept,
    } = req.body;

    const festDataToUpdate = {};
    let hasChanges = false;

    if (title !== undefined && title !== currentFest.fest_title) {
      festDataToUpdate.fest_title = title;
      hasChanges = true;
    }
    if (
      opening_date !== undefined &&
      (opening_date || null) !== currentFest.opening_date
    ) {
      festDataToUpdate.opening_date = opening_date || null;
      hasChanges = true;
    }
    if (
      closing_date !== undefined &&
      (closing_date || null) !== currentFest.closing_date
    ) {
      festDataToUpdate.closing_date = closing_date || null;
      hasChanges = true;
    }
    if (
      detailed_description !== undefined &&
      detailed_description !== currentFest.description
    ) {
      festDataToUpdate.description = detailed_description;
      hasChanges = true;
    }
    if (
      department !== undefined &&
      JSON.stringify(department) !==
        JSON.stringify(currentFest.department_access)
    ) {
      festDataToUpdate.department_access = department || [];
      hasChanges = true;
    }
    if (category !== undefined && category !== currentFest.category) {
      festDataToUpdate.category = category;
      hasChanges = true;
    }
    if (
      contact_email !== undefined &&
      contact_email !== currentFest.contact_email
    ) {
      festDataToUpdate.contact_email = contact_email;
      hasChanges = true;
    }
    const proContactPhone = contact_phone
      ? String(contact_phone).trim().replace(/\D/g, "")
      : null;
    if (proContactPhone !== currentFest.contact_phone) {
      festDataToUpdate.contact_phone = proContactPhone;
      hasChanges = true;
    }
    if (
      event_heads !== undefined &&
      JSON.stringify(event_heads) !== JSON.stringify(currentFest.event_heads)
    ) {
      festDataToUpdate.event_heads = event_heads || [];
      hasChanges = true;
    }
    if (
      festImageUrl !== undefined &&
      (festImageUrl || null) !== currentFest.fest_image_url
    ) {
      festDataToUpdate.fest_image_url = festImageUrl || null;
      hasChanges = true;
    }
    if (
      organizing_dept !== undefined &&
      organizing_dept !== currentFest.organizing_dept
    ) {
      festDataToUpdate.organizing_dept = organizing_dept;
      hasChanges = true;
    }

    if (
      title !== undefined &&
      typeof title === "string" &&
      title.trim() !== ""
    ) {
      const newFestSlug = title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      if (newFestSlug !== currentFest.fest_id) {
        festDataToUpdate.fest_id = newFestSlug;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      return res
        .status(200)
        .json({ message: "No changes detected to update.", fest: currentFest });
    }

    festDataToUpdate.updated_at = new Date().toISOString();
    festDataToUpdate.updated_by = appUserData.email;

    const { data: updatedFest, error: updateError } = await supabase
      .from("fest")
      .update(festDataToUpdate)
      .eq("fest_id", festId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116")
        return res.status(404).json({
          error: "Fest not found during update, or authorization failed.",
        });
      if (updateError.code === "23505" && festDataToUpdate.fest_id) {
        return res.status(409).json({
          error: `Failed to update fest: The new fest ID (slug) '${festDataToUpdate.fest_id}' likely conflicts with an existing fest. ${updateError.message}`,
        });
      }
      return res
        .status(400)
        .json({ error: `Error updating fest: ${updateError.message}` });
    }

    if (
      oldFestImageUrl &&
      festDataToUpdate.fest_image_url !== oldFestImageUrl
    ) {
      const oldImagePath = getPathFromStorageUrl(
        oldFestImageUrl,
        "fest-images"
      );
      if (oldImagePath) {
        await supabase.storage
          .from("fest-images")
          .remove([oldImagePath])
          .catch((e) =>
            console.warn(
              `Fest updated, but failed to delete old image '${oldImagePath}': ${e.message}`
            )
          );
      }
    }

    return res
      .status(200)
      .json({ fest: updatedFest, message: "Fest updated successfully." });
  } catch (error) {
    console.error("Overall error PUT /api/fests/:festId:", error);
    return res
      .status(500)
      .json({ error: "Internal server error while updating fest." });
  }
});

router.delete("/:festId", async (req, res) => {
  const { festId } = req.params;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No token provided." });
    }
    const token = authHeader.split(" ")[1];
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ error: "Unauthorized: Invalid token." });
    }

    const { data: appUserData, error: appUserDbError } = await supabase
      .from("users")
      .select("is_organiser, email")
      .eq("email", authUser.email)
      .single();

    if (appUserDbError || !appUserData) {
      console.error(
        "App user fetch error for DELETE /api/fests:",
        appUserDbError
      );
      return res
        .status(403)
        .json({ error: "Forbidden: User profile issue for authorization." });
    }

    const { data: existingFest, error: fetchFestError } = await supabase
      .from("fest")
      .select("created_by, fest_image_url")
      .eq("fest_id", festId)
      .single();

    if (fetchFestError) {
      if (fetchFestError.code === "PGRST116") {
        return res
          .status(404)
          .json({ error: `Fest with ID (slug) '${festId}' not found.` });
      }
      return res
        .status(500)
        .json({ error: `Error fetching fest: ${fetchFestError.message}` });
    }

    const isCreator = existingFest.created_by === appUserData.email;
    const isAuthUserOrganizer = appUserData.is_organiser === true;

    if (!(isCreator && isAuthUserOrganizer)) {
      return res.status(403).json({
        error: "Forbidden: You are not authorized to delete this fest.",
      });
    }

    const { data: associatedEvents, error: fetchEventsError } = await supabase
      .from("events")
      .select("event_id, event_image_url, banner_url, pdf_url")
      .eq("fest", festId);

    if (fetchEventsError) {
      return res.status(500).json({
        error: `Error fetching associated events: ${fetchEventsError.message}`,
      });
    }

    const eventStorageFilesToDelete = [];
    const eventIdsToDelete = [];

    if (associatedEvents && associatedEvents.length > 0) {
      for (const event of associatedEvents) {
        eventIdsToDelete.push(event.event_id);

        if (event.event_image_url) {
          const path = getPathFromStorageUrl(
            event.event_image_url,
            "event-images"
          );
          if (path)
            eventStorageFilesToDelete.push({ bucket: "event-images", path });
        }
        if (event.banner_url) {
          const path = getPathFromStorageUrl(event.banner_url, "event-banners");
          if (path)
            eventStorageFilesToDelete.push({ bucket: "event-banners", path });
        }
        if (event.pdf_url) {
          const path = getPathFromStorageUrl(event.pdf_url, "event-pdfs");
          if (path)
            eventStorageFilesToDelete.push({ bucket: "event-pdfs", path });
        }
      }

      const { error: deleteRegistrationsError } = await supabase
        .from("event_registrations")
        .delete()
        .in("event_id", eventIdsToDelete);

      if (deleteRegistrationsError) {
        console.warn(
          `Failed to delete some registrations for events under fest ${festId}: ${deleteRegistrationsError.message}`
        );
      }

      for (const file of eventStorageFilesToDelete) {
        await supabase.storage
          .from(file.bucket)
          .remove([file.path])
          .catch((e) =>
            console.warn(
              `Failed to delete event file ${file.path} from ${file.bucket}: ${e.message}`
            )
          );
      }

      const { error: deleteEventsDbError } = await supabase
        .from("events")
        .delete()
        .in("event_id", eventIdsToDelete);

      if (deleteEventsDbError) {
        return res.status(500).json({
          error: `Error deleting associated events from database: ${deleteEventsDbError.message}`,
        });
      }
    }

    const festImageUrlToDelete = existingFest.fest_image_url;
    if (festImageUrlToDelete) {
      const festImagePath = getPathFromStorageUrl(
        festImageUrlToDelete,
        "fest-images"
      );
      if (festImagePath) {
        await supabase.storage
          .from("fest-images")
          .remove([festImagePath])
          .catch((e) =>
            console.warn(
              `Fest record deleted, but failed to delete fest image '${festImagePath}': ${e.message}`
            )
          );
      }
    }

    const { error: deleteFestDbError } = await supabase
      .from("fest")
      .delete()
      .eq("fest_id", festId);

    if (deleteFestDbError) {
      return res.status(500).json({
        error: `Error deleting fest from database: ${deleteFestDbError.message}`,
      });
    }

    return res.status(200).json({
      message:
        "Fest and all associated events and registrations deleted successfully.",
    });
  } catch (error) {
    console.error(`Overall error DELETE /api/fests/${festId}:`, error);
    return res
      .status(500)
      .json({ error: "Internal server error while deleting fest." });
  }
});

export default router;
