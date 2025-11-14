import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "./mode-toggle"
import { NavUser } from "./nav-user"

const user = {
  username: "6510615120",
  name: "Tanapat Sa-nguantud",
  email: "Theeraphat.Sa-@dome.tu.ac.th",
  role: "Teacher",
  faculty: "คณะศิลปกรรมศาสตร์"
}

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <h1 className="text-base font-medium"></h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle className="-ml-1" />
          <NavUser user={user} />
        </div>
      </div>
    </header>
  )
}
