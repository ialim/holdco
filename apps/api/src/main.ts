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
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap();
