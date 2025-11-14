"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  GraduationCap,
  IdCard,
  LogOut,
  Mail,
  Sparkles,
  User,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

function getFirstLetterCapitalized(name: string) {
  if (!name) return "";

  const match = name.match(/[a-zA-Z]/);
  if (!match) return "";

  return match[0].toUpperCase();
}

export function NavUser({
  user,
}: {
  user: {
    username: string
    name: string
    email: string
    role: string
    faculty: string
  }
}) {
  const { isMobile } = useSidebar()

  const handleLogout = () => {
    localStorage.removeItem("token"); 
    window.location.href = "/login";
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{getFirstLetterCapitalized(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.username}</span>
                <span className="truncate text-xs">{user.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{getFirstLetterCapitalized(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
              <DropdownMenuGroup >
                <DropdownMenuItem
                  tabIndex={-1}
                  aria-disabled="true"
                  className="pointer-events-none cursor-default select-none w-full max-w-[180px]"
                >
                  <BadgeCheck />
                  {user.role}
                </DropdownMenuItem>
                <DropdownMenuItem
                  tabIndex={-1}
                  aria-disabled="true"
                  className="pointer-events-none cursor-default select-none w-full max-w-[180px]"
                >
                  <IdCard />
                  {user.username}
                </DropdownMenuItem>
                <DropdownMenuItem
                  tabIndex={-1}
                  aria-disabled="true"
                  className="pointer-events-none cursor-default select-none w-full max-w-[180px]"
                >
                  <User />
                  {user.name}
                </DropdownMenuItem>
                <DropdownMenuItem
                  tabIndex={-1}
                  aria-disabled="true"
                  className="pointer-events-none cursor-default select-none w-full max-w-[180px]"
                >
                  <Mail />
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem
                  tabIndex={-1}
                  aria-disabled="true"
                  className="pointer-events-none cursor-default select-none w-full max-w-[180px]"
                >
                  <GraduationCap />
                  {user.faculty}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut />
                Log out
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
