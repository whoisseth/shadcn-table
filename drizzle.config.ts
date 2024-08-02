import { env } from "@/env"
import { type Config } from "drizzle-kit"

import { databasePrefix } from "@/lib/constants"

export default {
  schema: "./src/db/schema.ts",
  // dialect: "postgresql",
  dialect: "sqlite",
  out: "./drizzle",
  driver: "turso",
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: process.env.DB_AUTH_TOKEN!,
  },
  tablesFilter: [`${databasePrefix}_*`],
} satisfies Config
