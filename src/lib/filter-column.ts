import {
  eq,
  inArray,
  isNotNull,
  isNull,
  like,
  not,
  notLike,
  type Column,
  type ColumnBaseConfig,
  type ColumnDataType,
} from "drizzle-orm"

import { type DataTableConfig } from "@/config/data-table"

export function filterColumn({
  column,
  value,
  isSelectable,
}: {
  column: Column<ColumnBaseConfig<ColumnDataType, string>, object, object>
  value: string
  isSelectable?: boolean
}) {
  // Split the filter value by "~" to get the filter value and operator
  const [filterValue, filterOperator] = (value?.split("~").filter(Boolean) ??
    []) as [
    string,
    DataTableConfig["comparisonOperators"][number]["value"] | undefined,
  ] 

  if (!filterValue) return

  // Convert the filter value to lowercase for case-insensitive comparisons
  const lowerFilterValue = filterValue.toLowerCase()

  if (isSelectable) {
    // Handle selectable filters like "eq", "notEq", "isNull", and "isNotNull"
    switch (filterOperator) {
      case "eq":
        return inArray(
          column,
          lowerFilterValue.split(".").filter(Boolean) ?? []
        )
      case "notEq":
        return not(
          inArray(column, lowerFilterValue.split(".").filter(Boolean) ?? [])
        )
      case "isNull":
        return isNull(column)
      case "isNotNull":
        return isNotNull(column)
      default:
        return inArray(column, lowerFilterValue.split(".") ?? [])
    }
  }

  // Handle non-selectable filters like "ilike", "notIlike", "startsWith", and "endsWith"
  switch (filterOperator) {
    case "ilike":
      // SQLite uses "like" instead of "ilike" for case-insensitive matching
      return like(column, `%${lowerFilterValue}%`)
    case "notIlike":
      return notLike(column, `%${lowerFilterValue}%`)
    case "startsWith":
      return like(column, `${lowerFilterValue}%`)
    case "endsWith":
      return like(column, `%${lowerFilterValue}`)
    case "eq":
      return eq(column, lowerFilterValue)
    case "notEq":
      return not(eq(column, lowerFilterValue))
    case "isNull":
      return isNull(column)
    case "isNotNull":
      return isNotNull(column)
    default:
      return like(column, `%${lowerFilterValue}%`)
  }
}
