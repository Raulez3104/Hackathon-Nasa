import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { gamcRouter } from "./routes/gamc.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());
app.use("/api/gamc", gamcRouter);

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "geoqocha-api",
  });
});

app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});
