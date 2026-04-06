"use client"

import { useEffect, useMemo, useState } from "react"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Bot, CircleCheck, Settings, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

type AIConfigForm = {
    provider: string
    model: string
    api_key: string
    base_url: string
    temperature: string
    prompt_template: string
}

type AIConfigResponse = {
    provider: string
    model: string
    base_url: string
    temperature: number
    prompt_template: string
}

const DEFAULT_FORM: AIConfigForm = {
    provider: "openai",
    model: "",
    api_key: "",
    base_url: "",
    temperature: "0.2",
    prompt_template: "",
}

const PROVIDER_OPTIONS = [
    { label: "OpenAI", value: "openai" },
    { label: "Anthropic", value: "anthropic" },
    { label: "Google", value: "google" },
    { label: "Groq", value: "groq" },
    { label: "Ollama", value: "ollama" },
    { label: "Custom", value: "custom" },
]

export default function SettingsPage() {
    const { user } = useAuth()
    const [form, setForm] = useState<AIConfigForm>(DEFAULT_FORM)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loadError, setLoadError] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [hasExistingConfig, setHasExistingConfig] = useState(false)

    const temperatureValue = useMemo(() => {
        const parsed = Number(form.temperature)
        if (Number.isNaN(parsed)) {
            return null
        }
        return parsed
    }, [form.temperature])

    useEffect(() => {
        const loadConfig = async () => {
            if (!user?.token) {
                return
            }

            setIsLoading(true)
            setLoadError("")

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                })

                if (res.status === 404) {
                    setHasExistingConfig(false)
                    setForm(DEFAULT_FORM)
                    return
                }

                if (!res.ok) {
                    throw new Error("Failed to load AI settings")
                }

                const data: AIConfigResponse = await res.json()
                setHasExistingConfig(true)
                console.log(data)
                setForm({
                    provider: data.provider || "openai",
                    model: data.model || "",
                    api_key: "",
                    base_url: data.base_url || "",
                    temperature: Number.isFinite(data.temperature) ? String(data.temperature) : "0.2",
                    prompt_template: data.prompt_template || "",
                })
            } catch (err) {
                setLoadError(err instanceof Error ? err.message : "Failed to load AI settings")
            } finally {
                setIsLoading(false)
            }
        }

        loadConfig()
    }, [user])

    const setField = <K extends keyof AIConfigForm>(key: K, value: AIConfigForm[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const validate = () => {
        const nextErrors: Record<string, string> = {}

        if (!form.provider.trim()) {
            nextErrors.provider = "Provider is required"
        }

        if (!form.model.trim()) {
            nextErrors.model = "Model is required"
        }

        if (!hasExistingConfig && !form.api_key.trim()) {
            nextErrors.api_key = "API key is required for first-time setup"
        }

        if (!form.base_url.trim()) {
            nextErrors.base_url = "Base URL is required"
        }

        const temp = Number(form.temperature)
        if (Number.isNaN(temp)) {
            nextErrors.temperature = "Temperature must be a number"
        } else if (temp < 0 || temp > 2) {
            nextErrors.temperature = "Temperature should be between 0 and 2"
        }

        setErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!user?.token || !validate()) {
            return
        }

        setIsSaving(true)

        try {
            const payload = {
                provider: form.provider.trim(),
                model: form.model.trim(),
                api_key: form.api_key.trim(),
                base_url: form.base_url.trim(),
                temperature: Number(form.temperature),
                prompt_template: form.prompt_template,
            }

            const method = hasExistingConfig ? "PUT" : "POST"
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai`, {
                method,
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })
            console.log(method)
            if (!res.ok) {
                throw new Error("Failed to save AI settings")
            }

            setHasExistingConfig(true)
            setField("api_key", "")
            toast.success("AI settings saved", {
                description: "Your configuration has been updated successfully.",
            })
        } catch (err) {
            toast.error("Failed to save AI settings", {
                description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <BreadcrumbNav />
            <div className="flex-1 p-6">
                <div className="mb-8 flex items-center gap-2">
                    <Settings className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">Settings</h1>
                </div>

                {loadError && (
                    <Alert variant="destructive" className="mb-4">
                        <TriangleAlert className="h-4 w-4" />
                        <AlertTitle>Unable to load AI settings</AlertTitle>
                        <AlertDescription>{loadError}</AlertDescription>
                    </Alert>
                )}

                {hasExistingConfig && !isLoading && (
                    <Alert className="mb-4">
                        <CircleCheck className="h-4 w-4" />
                        <AlertTitle>Existing config detected</AlertTitle>
                        <AlertDescription>
                            API key is hidden for security. Enter a new key only when you want to rotate it.
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            AI Configuration
                        </CardTitle>
                        <CardDescription>
                            Configure your AI provider credentials and defaults for grading workflow.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Spinner className="h-4 w-4" />
                                Loading AI settings...
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="grid gap-5">
                                <Field>
                                    <FieldLabel htmlFor="provider">Provider</FieldLabel>
                                    <Select value={form.provider} onValueChange={(value) => setField("provider", value)}>
                                        <SelectTrigger id="provider" className="w-full">
                                            <SelectValue placeholder="Select provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROVIDER_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FieldError>{errors.provider}</FieldError>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="model">Model</FieldLabel>
                                    <Input
                                        id="model"
                                        placeholder="gpt-4.1-mini, claude-3-5-sonnet, gemini-1.5-pro"
                                        value={form.model}
                                        onChange={(e) => setField("model", e.target.value)}
                                    />
                                    <FieldError>{errors.model}</FieldError>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="api-key">API Key</FieldLabel>
                                    <Input
                                        id="api-key"
                                        type="password"
                                        placeholder={hasExistingConfig ? "Leave blank to keep current key" : "Paste your provider API key"}
                                        value={form.api_key}
                                        onChange={(e) => setField("api_key", e.target.value)}
                                        autoComplete="off"
                                    />
                                    <FieldDescription>
                                        {hasExistingConfig
                                            ? "For security reasons, current key is never shown."
                                            : "This key will be stored securely and used for grading calls."}
                                    </FieldDescription>
                                    <FieldError>{errors.api_key}</FieldError>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="base-url">Base URL</FieldLabel>
                                    <Input
                                        id="base-url"
                                        placeholder="https://api.openai.com/v1"
                                        value={form.base_url}
                                        onChange={(e) => setField("base_url", e.target.value)}
                                    />
                                    <FieldError>{errors.base_url}</FieldError>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="temperature">Temperature (0 - 2)</FieldLabel>
                                    <Input
                                        id="temperature"
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        max={2}
                                        step="0.1"
                                        value={form.temperature}
                                        onChange={(e) => setField("temperature", e.target.value)}
                                    />
                                    <FieldDescription>
                                        Lower values are more deterministic. Current value: {temperatureValue ?? "-"}
                                    </FieldDescription>
                                    <FieldError>{errors.temperature}</FieldError>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="prompt-template">Prompt Template</FieldLabel>
                                    <Textarea
                                        id="prompt-template"
                                        rows={8}
                                        placeholder="Define system prompt/instructions used during grading"
                                        value={form.prompt_template}
                                        onChange={(e) => setField("prompt_template", e.target.value)}
                                    />
                                </Field>

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? (
                                            <>
                                                <Spinner className="mr-2 h-4 w-4" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Settings className="mr-2 h-4 w-4" />
                                                Save AI Settings
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
