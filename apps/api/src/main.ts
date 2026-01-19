import "reflect-metadata";
import { config } from "dotenv";
import { existsSync } from "fs";
import { join } from "path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const envCandidates = [
  join(process.cwd(), ".env"),
  join(process.cwd(), "apps/api/.env"),
  join(__dirname, "../.env"),
  join(__dirname, "../../.env"),
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3001")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!corsOrigins.length || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin not allowed: ${origin}`), false);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Idempotency-Key",
      "X-Group-Id",
      "X-Subsidiary-Id",
      "X-Location-Id",
      "X-Channel",
    ],
  });
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap();
