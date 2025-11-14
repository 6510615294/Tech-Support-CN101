import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  const cookieStore = cookies()
  // const token = cookieStore.get("auth_token")

  // if (token) {
  //   redirect("/dashboard")
  // }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  )
}
