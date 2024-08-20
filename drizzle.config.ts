import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.development.local" });

export default defineConfig({
  schema: "./drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
