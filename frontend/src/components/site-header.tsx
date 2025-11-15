"use client";

import React, { useContext, useEffect, useState } from "react";
import { ModeToggle } from "./mode-toggle";
import { NavUser } from "./nav-user";

type User = {
  username: string;
  name: string;
  email: string;
  role: string;
  faculty: string;
};

export function SiteHeader({ user }: { user: User }) {
  // const [user, setUser] = useState<User | null>(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   async function fetchUser() {
  //     try {
  //       const token = localStorage.getItem("token");

  //       if (!token) {
  //         window.location.href = "/login";
  //         throw new Error("Not have token");
  //       }

  //       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });

  //       if (!res.ok) {
  //         window.location.href = "/login";
  //         throw new Error("Failed to fetch user");
  //       }

  //       const data = await res.json();
  //       setUser(data);
  //     } catch (error) {
  //       setUser(null);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   fetchUser();
  // }, []);

  // if (loading) {
  //   return (
  //     <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b px-4 lg:px-6">
  //       <div>Loading...</div>
  //     </header>
  //   );
  // }

  // if (!user) {
  //   return window.location.href = "/login";
  // }

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      <div className="flex w-full items-center gap-1 lg:gap-2">
        <h1 className="text-base font-medium">Welcome, {user.name}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle className="-ml-1" />
          <NavUser user={user} />
        </div>
      </div>
    </header>
  );
}
