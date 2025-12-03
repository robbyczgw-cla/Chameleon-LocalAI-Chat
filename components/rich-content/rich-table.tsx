"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface RichTableData {
  headers: string[]
  rows: string[][]
  sortable?: boolean
  searchable?: boolean
}

interface RichTableProps {
  data: RichTableData
  className?: string
}

export function RichTable({ data, className }: RichTableProps) {
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [searchQuery, setSearchQuery] = useState("")

  const handleSort = (columnIndex: number) => {
    if (!data.sortable) return

    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnIndex)
      setSortDirection("asc")
    }
  }

  const processedRows = useMemo(() => {
    let result = [...data.rows]

    // Search filter
    if (data.searchable && searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((row) =>
        row.some((cell) => cell.toLowerCase().includes(query))
      )
    }

    // Sort
    if (data.sortable && sortColumn !== null) {
      result.sort((a, b) => {
        const aVal = a[sortColumn] || ""
        const bVal = b[sortColumn] || ""

        // Try numeric sort first
        const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ""))
        const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ""))

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum
        }

        // Fallback to string sort
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      })
    }

    return result
  }, [data.rows, data.sortable, data.searchable, sortColumn, sortDirection, searchQuery])

  return (
    <Card className={`my-4 overflow-hidden ${className || ""}`}>
      {data.searchable && (
        <div className="p-3 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-muted/70">
            <tr>
              {data.headers.map((header, index) => (
                <th
                  key={index}
                  onClick={() => handleSort(index)}
                  className={cn(
                    "px-3 py-2.5 text-left font-semibold border-r border-border last:border-r-0 text-xs sm:text-sm",
                    data.sortable && "cursor-pointer hover:bg-muted transition-colors select-none"
                  )}
                >
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    {header}
                    {data.sortable && (
                      <span className="text-muted-foreground">
                        {sortColumn === index ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {processedRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-muted/30 transition-colors"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-3 py-2.5 border-r border-border last:border-r-0 text-xs sm:text-sm"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {processedRows.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No results found
          </div>
        )}
      </div>

      {data.searchable && (
        <div className="px-3 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
          Showing {processedRows.length} of {data.rows.length} rows
        </div>
      )}
    </Card>
  )
}
