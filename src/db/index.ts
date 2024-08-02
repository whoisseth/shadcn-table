import { env } from "@/env"
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

import * as schema from "./schema"

// const client = postgres(env.DATABASE_URL)
export const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DB_AUTH_TOKEN!,
})

export const db = drizzle(client, { schema })
