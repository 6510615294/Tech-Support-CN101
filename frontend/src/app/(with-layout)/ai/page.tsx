"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertCircle, Brain, Settings } from "lucide-react"

export default function AILandingPage() {
  const { user } = useAuth()
    
  return (
    <>
      <BreadcrumbNav />
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">AI Agent Portal</h1>
              <p className="mt-1 text-sm text-muted-foreground">Manage AI Configuration and Grading Tasks</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link href="/ai/jobs">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      <CardTitle>Grading Jobs</CardTitle>
                    </div>
                    <CardDescription>AI Auto grading Jobs Dashboard</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline">Go to Jobs Dashboard</Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/ai/settings">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      <CardTitle>Settings</CardTitle>
                    </div>
                    <CardDescription>Configure AI settings and preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline">Go to Settings</Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
    </>
  )
}