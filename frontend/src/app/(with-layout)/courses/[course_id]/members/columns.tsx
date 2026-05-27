"use client"

import { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDown,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

type CourseMember = {
  user_id: string
  username: string
  en_name: string
  th_name: string
  email: string
  status: string
  role: string
}

const statusStyles: Record<string, string> = {
  active: "bg-green-500 hover:bg-green-500",
  inactive: "bg-gray-400 hover:bg-gray-400",
  withdraw: "bg-yellow-500 hover:bg-yellow-500",
  drop: "bg-red-500 hover:bg-red-500",
  teacher: "bg-blue-500 hover:bg-blue-500",
  ta: "bg-purple-500 hover:bg-purple-500",
  student: "bg-green-500 hover:bg-green-500",
}

export const getColumns = (
  course_id: string,
  handleChangeStatus: (userId: string, status: string) => void,
  handleChangeRole: (userId: string, status: string) => void,
  handleDeleteMember: (userId: string) => void,
  currentUsername?: string,
  options?: {
    showStatus?: boolean,
  },
): ColumnDef<CourseMember>[] => {
  const showStatus = options?.showStatus ?? true

  const columns: ColumnDef<CourseMember>[] = [

    {
      accessorKey: "username",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Username
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
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        const userId = row.original.user_id
        const isCurrentUser = !!currentUsername && row.original.username === currentUsername
        const isSelfTeacher = isCurrentUser && role === "teacher"

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge
                className={`${statusStyles[role] ?? "bg-gray-300"} capitalize`}
              >
                {role == "ta" ? "TA" : role}
              </Badge>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Change Role</DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() => handleChangeRole(userId, "student")}
                disabled={role === "student" || isSelfTeacher}
              >
                Student
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleChangeRole(userId, "ta")}
                disabled={role === "ta" || isSelfTeacher}
              >
                TA
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleChangeRole(userId, "teacher")}
                disabled={role === "teacher"}
              >
                Teacher
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    },
    {
      id: "actions",
      header: "Remove",
      cell: ({ row }) => {
        const userId = row.original.user_id

        return (
          <Button
            variant={"ghost"}
            onClick={() => handleDeleteMember(userId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )
      },
    },
  ];

  if (showStatus) {
    columns.splice(4, 0, {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const userId = row.original.user_id

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge
                className={`${statusStyles[status] ?? "bg-gray-300"} capitalize`}
              >
                {status}
              </Badge>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() => handleChangeStatus(userId, "active")}
                disabled={status === "active"}
              >
                Active
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleChangeStatus(userId, "inactive")}
                disabled={status === "inactive"}
              >
                Inactive
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleChangeStatus(userId, "withdraw")}
                disabled={status === "withdraw"}
              >
                Withdraw
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleChangeStatus(userId, "drop")}
                disabled={status === "drop"}
              >
                Drop
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    })
  }

  return columns
}