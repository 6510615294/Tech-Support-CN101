"use client";

import Link from "next/link";
import {
  LayoutTemplate,
  Box,
  School,
  FileText,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileTextIcon,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { useParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type NavMainProps = {
  isTeacher: boolean;
};

export function NavMain({ isTeacher }: NavMainProps) {
  const pathname = usePathname();
  const inCourse = /^\/courses\/(?!create$)[^/]+(\/.*)?$/.test(pathname);
  const { course_id } = useParams()

  return (
    <SidebarGroup className="group">
      <SidebarMenu>
        <SidebarMenuItem key="courses">
          <SidebarMenuButton asChild>
            <Link href="/courses">
              <School />
              <span className="group-data-[collapsible=icon]:hidden">Courses</span>
            </Link>
          </SidebarMenuButton>

          {inCourse && (
            <SidebarMenuSub>
              <SidebarMenuSubItem key="assignment">
                <SidebarMenuSubButton asChild>
                  <Link href={`/courses/${course_id}/assignments`}>
                    <span className="group-data-[collapsible=icon]:hidden">Assignments</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem key="resource">
                <SidebarMenuSubButton asChild>
                  <Link href={`/courses/${course_id}/resources`}>
                    <span className="group-data-[collapsible=icon]:hidden">Resources</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>

        {isTeacher && (
          <>
            <SidebarMenuItem key="template">
              <SidebarMenuButton asChild>
                <Link href="/templates">
                  <LayoutTemplate />
                  <span className="group-data-[collapsible=icon]:hidden">Template</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem key="storage">
              <SidebarMenuButton asChild>
                <Link href="/storage">
                  <Box />
                  <span className="group-data-[collapsible=icon]:hidden">Storage</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
