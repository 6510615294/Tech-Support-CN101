"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  LogOut,
  Settings,
  File,
  BookDashed,
  LayoutTemplate,
  Sparkle,
} from "lucide-react"

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = [
    {
      title: "Courses",
      href: "/courses",
      icon: BookOpen,
    },
    {
      title: "Templates",
      href: "/templates",
      icon: LayoutTemplate,
    },
    {
      title: "Attachment",
      href: "/attachments",
      icon: File,
    },
    {
      title: "AI Agent",
      href: "/ai",
      icon: Sparkle,
    },
  ]

  const visibleNavItems = user?.role === "student"
    ? navItems.filter((item) => item.href === "/courses")
    : navItems

  const isItemActive = (title: string, href: string) => {
    if (title === "Courses") {
      return pathname === href || pathname.startsWith("/courses/")
    }

    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/courses" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">CN101</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isItemActive(item.title, item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {user && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user.en_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {user.username}
                </span>
                <Badge variant="outline" className="w-fit text-xs capitalize">
                  {user.role}
                </Badge>
              </div>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
