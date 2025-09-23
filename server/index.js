import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { initializeDatabase } from "./config/database.js";

// Using MySQL-based routes
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes_secured.js";  // Using secured routes
import festRoutes from "./routes/festRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize MySQL database
await initializeDatabase();

const app = express();
app.use(express.json());
app.use(cors());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/fests", festRoutes);
app.use("/api", registrationRoutes);
app.use("/api", attendanceRoutes);
app.use("/api", notificationRoutes);
app.use("/api", uploadRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Upload directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`Database path: ${path.join(__dirname, 'data', 'socio-copy.db')}`);
});
