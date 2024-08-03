"use server"

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import { db } from "@/db/index"
import { tasks, type Task } from "@/db/schema"
import { takeFirstOrThrow } from "@/db/utils"
import { count, eq, inArray } from "drizzle-orm"
import { customAlphabet } from "nanoid"

import { getErrorMessage } from "@/lib/handle-error"

import { generateRandomTask } from "./utils"
import type { CreateTaskSchema, UpdateTaskSchema } from "./validations"

export async function seedTasks(input: { count: number }) {
  const count = input.count ?? 100

  try {
    const allTasks: Task[] = []

    for (let i = 0; i < count; i++) {
      allTasks.push(generateRandomTask())
    }

    await db.delete(tasks)

    console.log("📝 Inserting tasks", allTasks.length)

    await db.insert(tasks).values(allTasks).onConflictDoNothing()
  } catch (err) {
    console.error(err)
  }
}

export async function createTask(input: CreateTaskSchema) {
  noStore()
  const maxTaskLimit = 15

  try {
    const taskCount = await db
      .select()
      .from(tasks)
      .then((result) => result.length)

    if (taskCount >= maxTaskLimit) {
      throw new Error(
        `Task limit reached. You cannot have more than ${maxTaskLimit} tasks. If you want to create a new task, please delete a previous task first.`
      )
    }

    await db.transaction(async (tx) => {
      const newTask = await tx
        .insert(tasks)
        .values({
          code: `TASK-${customAlphabet("0123456789", 4)()}`,
          title: input.title,
          status: input.status,
          label: input.label,
          priority: input.priority,
        })
        .returning({
          id: tasks.id,
        })
        .then(takeFirstOrThrow)

      // Uncomment this block if you want to delete the oldest task to keep the total number of tasks constant
      // await tx.delete(tasks).where(
      //   eq(
      //     tasks.id,
      //     (
      //       await tx
      //         .select({
      //           id: tasks.id,
      //         })
      //         .from(tasks)
      //         .limit(1)
      //         .where(not(eq(tasks.id, newTask.id)))
      //         .orderBy(asc(tasks.createdAt))
      //         .then(takeFirstOrThrow)
      //     ).id
      //   )
      // );
    })

    revalidatePath("/")

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    let errorMessage = "An error occurred while creating the task."

    if (err instanceof Error) {
      errorMessage = err.message
    }

    return {
      data: null,
      error: errorMessage,
    }
  }
}

export async function updateTask(input: UpdateTaskSchema & { id: string }) {
  noStore()
  try {
    await db
      .update(tasks)
      .set({
        title: input.title,
        label: input.label,
        status: input.status,
        priority: input.priority,
      })
      .where(eq(tasks.id, input.id))

    revalidatePath("/")

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

export async function updateTasks(input: {
  ids: string[]
  label?: Task["label"]
  status?: Task["status"]
  priority?: Task["priority"]
}) {
  noStore()
  try {
    await db
      .update(tasks)
      .set({
        label: input.label,
        status: input.status,
        priority: input.priority,
      })
      .where(inArray(tasks.id, input.ids))

    revalidatePath("/")

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

export async function deleteTask(input: { id: string }) {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(tasks).where(eq(tasks.id, input.id))

      // Create a new task for the deleted one
      // await tx.insert(tasks).values(generateRandomTask())
    })

    revalidatePath("/")
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

export async function deleteTasksOld(input: { ids: string[] }) {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(tasks).where(inArray(tasks.id, input.ids))

      // Create new tasks for the deleted ones
      // await tx.insert(tasks).values(input.ids.map(() => generateRandomTask()))
    })

    revalidatePath("/")

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}
export async function deleteTasks(input: { ids: string[] }) {
  try {
    // Count the current number of tasks
    const taskCountResult = await db
      .select({
        count: count(),
      })
      .from(tasks)
      .then(takeFirstOrThrow)

    const taskCount = taskCountResult.count

    // Calculate the remaining tasks after deletion
    const remainingTasks = taskCount - input.ids.length

    // Prevent deletion if resulting number of tasks is below the threshold
    if (remainingTasks < 5) {
      throw new Error(
        `Cannot delete the tasks. You must have at least 5 tasks in the database after deletion.`
      )
    }

    // Proceed with deletion if the condition is satisfied
    await db.transaction(async (tx) => {
      await tx.delete(tasks).where(inArray(tasks.id, input.ids))
    })

    // Revalidate path after deletion
    revalidatePath("/")

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    // Handle errors
    let errorMessage = "An error occurred while deleting the tasks."

    if (err instanceof Error) {
      errorMessage = err.message
    }

    return {
      data: null,
      error: errorMessage,
    }
  }
}

export async function getChunkedTasks(input: { chunkSize?: number } = {}) {
  try {
    const chunkSize = input.chunkSize ?? 1000

    const totalTasks = await db
      .select({
        count: count(),
      })
      .from(tasks)
      .then(takeFirstOrThrow)

    const totalChunks = Math.ceil(totalTasks.count / chunkSize)

    let chunkedTasks

    for (let i = 0; i < totalChunks; i++) {
      chunkedTasks = await db
        .select()
        .from(tasks)
        .limit(chunkSize)
        .offset(i * chunkSize)
        .then((tasks) =>
          tasks.map((task) => ({
            ...task,
            createdAt: task.createdAt.toString(),
            updatedAt: task.updatedAt?.toString(),
          }))
        )
    }

    return {
      data: chunkedTasks,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}
