"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Fragment } from "react"

interface BreadcrumbNavProps {
  courseName?: string
  assignmentName?: string
}

export function BreadcrumbNav({ courseName, assignmentName }: BreadcrumbNavProps) {
  const pathname = usePathname()
  
  const pathSegments = pathname.split("/").filter(Boolean)
  
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/")
    const isLast = index === pathSegments.length - 1
    
    let label = segment.charAt(0).toUpperCase() + segment.slice(1)
    
    // Handle special cases
    if (segment === "courses") {
      label = "Courses"
    } else if (pathSegments[index - 1] === "courses" && courseName) {
      label = courseName
    } else if (segment === "assignments") {
      label = "Assignments"
    } else if (pathSegments[index - 1] === "assignments" && assignmentName) {
      label = assignmentName
    }
    
    return { href, label, isLast }
  })
  
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
