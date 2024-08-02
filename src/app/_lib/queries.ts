import "server-only"

import { unstable_noStore as noStore } from "next/cache"
import { db } from "@/db"
import { tasks, type Task } from "@/db/schema"
import { type DrizzleWhere } from "@/types"
import { and, asc, count, desc, gte, lte, or, type SQL } from "drizzle-orm"

import { filterColumn } from "@/lib/filter-column"

import { type GetTasksSchema } from "./validations"

interface TaskResponse {
  data: Task[]
  totalRows: number
  pageCount: number
}

interface TaskCount {
  status?: string
  priority?: string
  count: number
}

export async function getTasks(input: GetTasksSchema): Promise<TaskResponse> {
  noStore()
  const { page, per_page, sort, title, status, priority, operator, from, to } =
    input

  try {
    // Calculate offset for pagination
    const offset = (page - 1) * per_page
    // Split the sort string to determine column and order (e.g., "title.desc" => ["title", "desc"])
    const [column, order] = (sort?.split(".").filter(Boolean) ?? [
      "createdAt",
      "desc",
    ]) as [keyof Task | undefined, "asc" | "desc" | undefined]

    // Convert date strings to Date objects for date filtering
    const fromDay = from ? new Date(from) : undefined
    const toDay = to ? new Date(to) : undefined

    const expressions: (SQL<unknown> | undefined)[] = [
      // Apply title filter if provided
      title
        ? filterColumn({
            column: tasks.title,
            value: title,
          })
        : undefined,
      // Apply status filter if provided
      !!status
        ? filterColumn({
            column: tasks.status,
            value: status,
            isSelectable: true,
          })
        : undefined,
      // Apply priority filter if provided
      !!priority
        ? filterColumn({
            column: tasks.priority,
            value: priority,
            isSelectable: true,
          })
        : undefined,
      // Apply date range filter if both dates are provided
      fromDay && toDay
        ? and(gte(tasks.createdAt, fromDay), lte(tasks.createdAt, toDay))
        : undefined,
    ]

    // Combine filters using "and" or "or" based on the operator
    const where: DrizzleWhere<Task> =
      !operator || operator === "and" ? and(...expressions) : or(...expressions)

    // Execute queries within a transaction for consistency
    const { data, totalRows } = await db.transaction(async (tx) => {
      const data = await tx
        .select()
        .from(tasks)
        .limit(per_page)
        .offset(offset)
        .where(where)
        .orderBy(
          column && column in tasks
            ? order === "asc"
              ? asc(tasks[column])
              : desc(tasks[column])
            : desc(tasks.id)
        )

      const totalRows = await tx
        .select({ count: count() })
        .from(tasks)
        .where(where)
        .execute()
        .then((res) => res[0]?.count ?? 0)

      return {
        data,
        totalRows,
      }
    })

    // Calculate the total number of pages
    const pageCount = Math.ceil(totalRows / per_page)
    return { data, totalRows, pageCount }
  } catch (err) {
    // Log error for debugging
    console.error(err)
    return { data: [], totalRows: 0, pageCount: 0 }
  }
}

export async function getTaskCountByStatus(): Promise<TaskCount[]> {
  noStore()
  try {
    return await db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .groupBy(tasks.status)
      .execute()
  } catch (err) {
    return []
  }
}

export async function getTaskCountByPriority(): Promise<TaskCount[]> {
  noStore()
  try {
    return await db
      .select({
        priority: tasks.priority,
        count: count(),
      })
      .from(tasks)
      .groupBy(tasks.priority)
      .execute()
  } catch (err) {
    return []
  }
}
