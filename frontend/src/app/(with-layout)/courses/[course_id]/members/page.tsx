"use client"

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table"
import { getColumns } from "./columns";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { AlertCircle, Users, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EnrollDialog } from "@/components/enroll-dialog";

type CourseMember = {
  user_id: string
  username: string
  en_name: string
  th_name: string
  email: string
  status: string
  role: string
}

function MemberTableSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export default function Page() {
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [courseName, setCourseName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CourseMember | null>(null)
  const { course_id } = useParams();
  const { user } = useAuth()

  useEffect(() => {
    const loadMember = async () => {
      if (!user) return
      setIsLoading(true);
      try {
        const courseRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        )

        if (courseRes.ok) {
          const courseData = await courseRes.json()
          setCourseName(courseData.name || "")
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/members`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        if (!res.ok) {
          throw new Error("Failed to fetch members")
        }
        const data = await res.json();
        setMembers(data);//data.filter((m: CourseMember) => m.role === "student")
      } catch (err) {
        toast.error("Error", {
          description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        })
        setError(err instanceof Error ? err.message : "Failed to load members")
        setMembers([])
      } finally {
        setIsLoading(false);
      }
    };
    loadMember();
  }, [course_id, user]);

  const handleChangeStatus = async (userId: string, newStatus: string) => {
    if (isUpdating || !user) return
    setIsUpdating(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/members/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          new_status: newStatus,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to change status", {
          description: "Something went wrong. Please try again.",
        });
        return;
      }

      setMembers((prev) => prev.map((m) => m.user_id === userId ? { ...m, status: newStatus } : m));
      toast.success("Status changed", {
        description: "The member status was updated successfully.",
      })
    } catch (err) {
      toast.error("Error changing status", {
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      })
    } finally {
      setIsUpdating(false)
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (isUpdating || !user) return

    const targetMember = members.find((m) => m.user_id === userId)
    const isSelfTeacher = targetMember?.username === user.username && targetMember.role === "teacher"
    if (isSelfTeacher && newRole !== "teacher") {
      toast.error("You cannot change your own teacher role", {
        description: "Only other teachers can change this teacher account's role.",
      })
      return
    }

    setIsUpdating(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/members/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          new_role: newRole,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to change role", {
          description: "Something went wrong. Please try again.",
        });
        return;
      }

      setMembers((prev) => prev.map((m) => m.user_id === userId ? { ...m, role: newRole } : m));
      toast.success("Role changed", {
        description: "The member role was updated successfully.",
      })
    } catch (err) {
      toast.error("Error changing role", {
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      })
    } finally {
      setIsUpdating(false)
    }
  };

  const handleDeleteMember = (userId: string) => {
    const target = members.find((m) => m.user_id === userId)
    setDeleteTarget(target ?? null)
  }

  const handleDelete = async () => {
    if (isUpdating || !user || !deleteTarget) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/members/${deleteTarget.user_id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${user.token}`,
        },
      });

      if (!res.ok) {
        toast.error("Failed to delete member", {
          description: "Something went wrong. Please try again.",
        });
        return;
      }

      setMembers((prev) => prev.filter((m) => m.user_id !== deleteTarget.user_id))
      toast.success("Member deleted", {
        description: "The member was removed from the course successfully.",
      })
    } catch (err) {
      toast.error("Error deleting member", {
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      })
    } finally {
      setDeleteTarget(null)
    }
  };

  const filteredMembers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return members

    return members.filter((member) => {
      return [member.username, member.en_name, member.th_name, member.email]
        .some((value) => value.toLowerCase().includes(keyword))
    })
  }, [members, searchTerm])

  const staffMembers = filteredMembers.filter((m: CourseMember) => m.role !== "student")
  const studentMembers = filteredMembers.filter((m: CourseMember) => m.role === "student")

  return (
    <div className="flex flex-col">
      <BreadcrumbNav courseName={courseName} />
      <div className="flex-1 space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Members</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {!isLoading && `${filteredMembers.length} members shown`}
            </p>
          </div>
          <EnrollDialog
            courseId={course_id as string}
            onEnrolled={() => {
              toast.warning("Please refresh page", {
                description: "Refresh page to see new members infomations"
              })
            }}
          />
        </div>

        {!isLoading && !error && (
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search members by username, name, thai name or email"
            className="max-w-md"
          />
        )}

        {error && !isLoading && (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>Failed to load members</EmptyTitle>
              <EmptyDescription>{error}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {!error && (
          <div className="space-y-8">
            {/* Staff Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  Staff
                  {!isLoading && (
                    <Badge variant="secondary" className="ml-1">{staffMembers.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5">
                {isLoading ? (
                  <MemberTableSkeleton />
                ) : staffMembers.length === 0 ? (
                  <Empty className="py-8">
                    <EmptyHeader>
                      <EmptyTitle>No staff assigned</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <DataTable
                    columns={getColumns(
                      course_id as string,
                      handleChangeStatus,
                      handleChangeRole,
                      handleDeleteMember,
                      user?.username
                    )}
                    data={staffMembers}
                    filterProps={[
                      {
                        column_name: "username",
                        column_display: "Username",
                        placeholder: "Filter username..."
                      },
                      {
                        column_name: "en_name",
                        column_display: "English Name",
                        placeholder: "Filter by name..."
                      },
                      {
                        column_name: "th_name",
                        column_display: "Thai Name",
                        placeholder: "Filter by name..."
                      },
                      {
                        column_name: "status",
                        column_display: "Status",
                        placeholder: "Filter by status..."
                      }
                    ]}
                  />
                )}
              </CardContent>
            </Card>

            {/* Students Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Students
                  {!isLoading && (
                    <Badge variant="secondary" className="ml-1">{studentMembers.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5">
                {isLoading ? (
                  <MemberTableSkeleton />
                ) : studentMembers.length === 0 ? (
                  <Empty className="py-8">
                    <EmptyHeader>
                      <EmptyTitle>No students enrolled</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <DataTable
                    columns={getColumns(
                      course_id as string,
                      handleChangeStatus,
                      handleChangeRole,
                      handleDeleteMember,
                      user?.username
                    )}
                    data={studentMembers}
                    filterProps={[
                      {
                        column_name: "username",
                        column_display: "Username",
                        placeholder: "Filter username..."
                      },
                      {
                        column_name: "en_name",
                        column_display: "English Name",
                        placeholder: "Filter by name..."
                      },
                      {
                        column_name: "th_name",
                        column_display: "Thai Name",
                        placeholder: "Filter by name..."
                      },
                      {
                        column_name: "status",
                        column_display: "Status",
                        placeholder: "Filter by status..."
                      }
                    ]}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-primary">{deleteTarget?.username}</span> will be permanently
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}