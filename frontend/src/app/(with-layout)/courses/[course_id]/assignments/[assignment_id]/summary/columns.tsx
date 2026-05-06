"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  MoreHorizontal,
  ArrowUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import ExtendDueDateDialog from "@/components/extend-due-date-dialog"

type SubmissionList = {
  user_id: string
  student_id: string
  en_name: string
  th_name: string
  email: string
  point: number
  percentage: number
  submission_status: string
}

interface CreateColumnsProps {
  courseId: string
  assignmentId: string
  fullPoint?: number | null
}

function handleSendReminder(userId: string) {
  console.log("handleSendReminder", userId)
}

function handleCommentAndGrade(userId: string) {
  console.log("handleCommentAndGrade", userId)
}

export function createColumns({ courseId, assignmentId, fullPoint }: CreateColumnsProps): {
  columns: ColumnDef<SubmissionList>[]
  dialog: React.ReactNode
} {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")

  const handleExtendDueDate = (userId: string) => {
    setSelectedUserId(userId)
    setDialogOpen(true)
  }

  const columns: ColumnDef<SubmissionList>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "student_id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Student ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "en_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const formatted = (row.getValue("en_name") as string)
          .replace(/\b\w/g, c => c.toUpperCase())
        return formatted
      }
    },
    {
      accessorKey: "th_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Thai Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "submission_status",
      header: "Status",
      cell: ({ row }) => <div className="">{row.getValue("submission_status")}</div>,
    },
    {
      accessorKey: "point",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-right"
          >
            {fullPoint != null ? `Point (${fullPoint})` : "Point"}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const point = parseFloat(String(row.getValue("point")))
        return <div className="text-right">{point}</div>
      }
    },
    {
      accessorKey: "percentage",
      header: () => <div className="text-right">Percentage</div>,
      cell: ({ row }) => {
        const percentage = parseFloat(row.getValue("percentage"))
        const formatted = `${percentage.toFixed(2)}%`

        return <div className="text-right">{formatted}</div>
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const userId = row.original.user_id

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleSendReminder(userId)}
              >
                Send reminder
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCommentAndGrade(userId)}
              >
                Comment And Grade
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExtendDueDate(userId)}
              >
                Extend due date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const dialog = (
    <ExtendDueDateDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      userId={selectedUserId}
      courseId={courseId}
      assignmentId={assignmentId}
    />
  )

  return { columns, dialog }
}