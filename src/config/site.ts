import { env } from "@/env"

export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Table",
  description:
    "Shadcn table component with server side sorting, pagination, and filtering",
  url:
    env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://shadcn-table-vert.vercel.app",
  links: { github: "https://github.com/whoisseth/shadcn-table" },
}
