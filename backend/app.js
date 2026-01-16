import dotenv from "dotenv";
import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./src/routes/auth.routes.js";
import scenarioRoutes from "./src/routes/scenario.routes.js";
import progressRoutes from "./src/routes/progress.routes.js";
import { sanitizeInput } from "./src/middleware/validation.middleware.js";

dotenv.config();

const app = express();

app.use(helmet()); 
app.use(cors(
//     {
//   origin: process.env.FRONTEND_URL || "*",
//         credentials: true,
//     }
));
app.use(json({ limit: "10mb" }));
app.use(sanitizeInput);

// app.get("/health", (_, res) => {
//   res.json({ status: "OK" });
// });

app.use("/api/auth", authRoutes);
app.use("/api/scenarios", scenarioRoutes);
app.use("/api/progress", progressRoutes);

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
  console.log(`  backend on ${PORT}`);
});

