"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Globe,
  Info,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Sparkles,
  TriangleAlert,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────────────────

type Provider = "openai" | "anthropic" | "google" | "custom"

type AIConfigForm = {
  provider: Provider
  model: string
  api_key: string
  base_url: string
  temperature: number
}

type AIConfigResponse = {
  provider: string
  model: string
  base_url: string
  temperature: number
  has_api_key: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVIDERS: {
  id: Provider
  label: string
  icon: React.ReactNode
  defaultBaseUrl: string
  hint: string
}[] = [
  {
    id: "openai",
    label: "OpenAI",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    ),
    defaultBaseUrl: "https://api.openai.com/v1",
    hint: "Get your key at platform.openai.com",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M17.304 3.541 12.836 14.13H9.084L13.551 3.54zm-10.608 0L2.168 14.13h3.75L8.7 7.79l1.977 4.986H7.43l-1.135 2.867H14.1l.715-1.8.715 1.8h3.736L14.695 3.54z" />
      </svg>
    ),
    defaultBaseUrl: "https://api.anthropic.com",
    hint: "Get your key at console.anthropic.com",
  },
  {
    id: "google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053z" />
      </svg>
    ),
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    hint: "Get your key at aistudio.google.com",
  },
  {
    id: "custom",
    label: "Custom",
    icon: <Globe className="h-5 w-5" />,
    defaultBaseUrl: "",
    hint: "Any OpenAI-compatible endpoint",
  },
]

const DEFAULT_FORM: AIConfigForm = {
  provider: "openai",
  model: "",
  api_key: "",
  base_url: PROVIDERS[0].defaultBaseUrl,
  temperature: 0.2,
}

// ─── Model Combobox ──────────────────────────────────────────────────────────

function ModelCombobox({
  value,
  onChange,
  models,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  models: string[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (v: string) => {
    setInputValue(v)
    onChange(v)
  }

  const handleSelect = (v: string) => {
    setInputValue(v)
    onChange(v)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className="truncate text-left">
            {inputValue || "Type or select a model"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type model name"
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {models.length === 0 ? (
              <CommandEmpty>
                No models fetched yet. Fetch or type your own.
              </CommandEmpty>
            ) : (
              <CommandGroup heading="Available models">
                {models.map((m) => {
                  const modelValue = typeof m === 'object' && m !== null && 'id' in m 
                    ? (m as { id: string }).id 
                    : String(m);
                  return (
                    <CommandItem key={modelValue} value={modelValue} onSelect={handleSelect}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === modelValue ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {modelValue}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ─── Provider Selector ───────────────────────────────────────────────────────

function ProviderCard({
  provider,
  selected,
  onClick,
}: {
  provider: (typeof PROVIDERS)[0]
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-all duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5 text-primary shadow-sm"
          : "border-border text-muted-foreground"
      )}
    >
      {selected && (
        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-2.5 w-2.5" />
        </span>
      )}
      {provider.icon}
      <span>{provider.label}</span>
    </button>
  )
}

// ─── Config Summary ──────────────────────────────────────────────────────────

function ConfigSummary({
  config,
  onEdit,
  onReset,
}: {
  config: AIConfigResponse
  onEdit: () => void
  onReset: () => void
}) {
  const providerMeta = PROVIDERS.find((p) => p.id === config.provider)

  return (
    <div className="space-y-4">
      <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4 !text-emerald-600 dark:!text-emerald-400" />
        <AlertTitle>AI provider configured</AlertTitle>
        <AlertDescription>
          Your integration is active. The API key is stored securely and never
          displayed.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-4 w-4" />
                AI configuration
              </CardTitle>
              <CardDescription className="mt-1">
                Current integration for grading workflows.
              </CardDescription>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs capitalize">
              {config.provider}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Provider", value: providerMeta?.label ?? config.provider },
              {
                label: "Model",
                value: config.model || "—",
                mono: true,
              },
              ...(config.provider === "custom" ? [{
                label: "Base URL",
                value: config.base_url || "—",
                mono: true,
                span: true,
              }] : []),
              {
                label: "Temperature",
                value: String(config.temperature ?? "—"),
              },
            ].map(({ label, value, mono, span }) => (
              <div
                key={label}
                className={cn(
                  "rounded-lg bg-muted/50 p-3",
                  span && "col-span-2"
                )}
              >
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    mono && "font-mono text-xs"
                  )}
                  title={value}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Remove config
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove AI configuration?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete your current provider settings. You will
                    need to set up a new configuration before grading workflows
                    can run.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onReset}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button size="sm" onClick={onEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Config Form ─────────────────────────────────────────────────────────────

function ConfigForm({
  isEdit,
  initialValues,
  onSuccess,
  onCancel,
  token,
  setConfig,
  config,
}: {
  isEdit: boolean
  initialValues: AIConfigForm
  onSuccess: (data: AIConfigResponse) => void
  onCancel?: () => void
  token?: string
  setConfig: (data: AIConfigResponse | null) => void
  config: AIConfigResponse | null
}) {
  const [form, setForm] = useState<AIConfigForm>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof AIConfigForm, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchedModels, setFetchedModels] = useState<string[]>([])
  const [fetchError, setFetchError] = useState("")
  const [hasSavedConfig, setHasSavedConfig] = useState(false)

  const providerMeta = useMemo(
    () => PROVIDERS.find((p) => p.id === form.provider),
    [form.provider]
  )

  const setField = useCallback(
    <K extends keyof AIConfigForm>(key: K, value: AIConfigForm[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  )

  const handleProviderChange = (p: Provider) => {
    const meta = PROVIDERS.find((x) => x.id === p)!
    setForm((prev) => ({
      ...prev,
      provider: p,
      base_url: p === "custom" ? prev.base_url : meta.defaultBaseUrl,
    }))
    setFetchedModels([])
    setFetchError("")
    setHasSavedConfig(false)
  }

  const validate = () => {
    const next: Partial<Record<keyof AIConfigForm, string>> = {}

    if (!form.provider) next.provider = "Select a provider."
    if (form.provider === "custom" && !form.base_url.trim())
      next.base_url = "Base URL is required for custom providers."
    if (!isEdit && !form.api_key.trim())
      next.api_key = "API key is required for first-time setup."
    if (!form.model.trim()) next.model = "Model is required."
    if (form.temperature < 0 || form.temperature > 2)
      next.temperature = "Must be between 0 and 2."

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const validateCredentials = () => {
    const next: Partial<Record<keyof AIConfigForm, string>> = {}

    if (!form.provider) next.provider = "Select a provider."
    if (form.provider === "custom" && !form.base_url.trim())
      next.base_url = "Base URL is required for custom providers."
    if (!form.api_key.trim())
      next.api_key = "API key is required for saving credentials."

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const validateConfiguration = () => {
    const next: Partial<Record<keyof AIConfigForm, string>> = {}

    if (!form.model.trim()) next.model = "Model is required."
    if (form.temperature < 0 || form.temperature > 2)
      next.temperature = "Must be between 0 and 2."

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleFetchModels = async () => {
    const hasApiKey = hasSavedConfig || config?.has_api_key
    if (!hasApiKey) {
      setFetchError("Please save your provider, API key, and base URL (if custom) first before fetching models.")
      return
    }

    setIsFetching(true)
    setFetchError("")

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/models`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) throw new Error("Failed to fetch models.")

      const data = await res.json()
      const models: string[] = Array.isArray(data)
        ? (typeof data[0] === 'object' && data[0] !== null && 'id' in data[0]
            ? data.map((m: { id: string }) => m.id)
            : data)
        : data.models ?? data.data?.map((m: { id: string }) => m.id) ?? []

      setFetchedModels(models)
      if (models.length === 0) setFetchError("No models returned from provider.")
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch models.")
    } finally {
      setIsFetching(false)
    }
  }

  const handleSaveCredentials = async () => {
    if (!validateCredentials()) return

    setIsSaving(true)
    try {
      const payload: Record<string, unknown> = {
        provider: form.provider,
        api_key: form.api_key.trim(),
        base_url: form.provider === "custom" ? form.base_url.trim() : "",
      }

      const method = config ? "PATCH" : "POST"
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to save credentials.")

      const data: AIConfigResponse = await res.json()
      toast.success("Credentials saved", {
        description: "Your provider credentials have been saved successfully.",
      })
      setHasSavedConfig(true)
      setConfig(data)
    } catch (err) {
      toast.error("Failed to save credentials", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveConfiguration = async () => {
    if (!validateConfiguration()) return

    setIsSaving(true)
    try {
      const payload: Record<string, unknown> = {
        model: form.model.trim(),
        temperature: form.temperature,
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to save configuration.")

      const data: AIConfigResponse = await res.json()
      toast.success("Configuration saved", {
        description: "Your model settings have been updated successfully.",
      })
      setConfig(data)
    } catch (err) {
      toast.error("Failed to save configuration", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {isEdit && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Updating configuration</AlertTitle>
          <AlertDescription>
            Leave the API key blank to keep the current one. To fetch available
            models, save your provider and API key first.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            {isEdit ? "Edit AI configuration" : "AI configuration"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? "Update your provider credentials and defaults."
              : "Set up your AI provider for grading workflows."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* ─── Credentials Section ─── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Credentials</h3>
                <p className="text-xs text-muted-foreground">
                  Set up your provider authentication first
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              {/* Provider */}
              <div className="space-y-2">
                <Label>Provider</Label>
            <div className="grid grid-cols-4 gap-2">
              {PROVIDERS.map((p) => (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  selected={form.provider === p.id}
                  onClick={() => handleProviderChange(p.id)}
                />
              ))}
            </div>
            {errors.provider && (
              <p className="text-xs text-destructive">{errors.provider}</p>
            )}
          </div>

          {/* Custom base URL */}
          {form.provider === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="base-url">Base URL</Label>
              <Input
                id="base-url"
                placeholder="https://api.example.com/v1"
                value={form.base_url}
                onChange={(e) => setField("base_url", e.target.value)}
                className={cn(errors.base_url && "border-destructive")}
              />
              <p className="text-xs text-muted-foreground">
                Any OpenAI-compatible endpoint.
              </p>
              {errors.base_url && (
                <p className="text-xs text-destructive">{errors.base_url}</p>
              )}
            </div>
          )}

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api-key">API key</Label>
            <Input
              id="api-key"
              type="password"
              autoComplete="off"
              placeholder={
                isEdit
                  ? "Leave blank to keep current key"
                  : "Paste your API key"
              }
              value={form.api_key}
              onChange={(e) => setField("api_key", e.target.value)}
              className={cn(errors.api_key && "border-destructive")}
            />
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? "For security, your current key is never shown."
                : (providerMeta?.hint ?? "Stored securely and never shown after saving.")}
            </p>
            {errors.api_key && (
              <p className="text-xs text-destructive">{errors.api_key}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={handleSaveCredentials} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-3.5 w-3.5" />
                  Save credentials
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

        <Separator />

        {/* ─── Configuration Section ─── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <Settings className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Configuration</h3>
              <p className="text-xs text-muted-foreground">
                Customize your AI model and settings
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            {/* Model */}
            <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Model</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleFetchModels}
                disabled={isFetching}
                className="h-7 gap-1.5 text-xs text-muted-foreground"
              >
                {isFetching ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {isFetching ? "Fetching…" : "Fetch models"}
              </Button>
            </div>

            <ModelCombobox
              value={form.model}
              onChange={(v) => setField("model", v)}
              models={fetchedModels}
            />

            {fetchError && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <TriangleAlert className="h-3 w-3 shrink-0" />
                {fetchError}
              </p>
            )}
            {fetchedModels.length > 0 && !fetchError && (
              <p className="text-xs text-muted-foreground">
                {fetchedModels.length} models loaded. Select from the list or
                type your own above.
              </p>
            )}
            {errors.model && (
              <p className="text-xs text-destructive">{errors.model}</p>
            )}
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="min-w-[2.5rem] text-right text-sm font-medium tabular-nums">
                {form.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={[form.temperature]}
              onValueChange={([v]) => setField("temperature", v)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Deterministic</span>
              <span>Creative</span>
            </div>
            {errors.temperature && (
              <p className="text-xs text-destructive">{errors.temperature}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveConfiguration} disabled={isSaving || !(hasSavedConfig || config?.has_api_key)}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-3.5 w-3.5" />
                  {isEdit ? "Update configuration" : "Save configuration"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex justify-end gap-2">
        {isEdit && onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Cancel
          </Button>
        )}
      </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth()

  const [config, setConfig] = useState<AIConfigResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [mode, setMode] = useState<"view" | "form" | "edit">("form")

  // Load existing config
  useEffect(() => {
    if (!user?.token) return

    const load = async () => {
      setIsLoading(true)
      setLoadError("")
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai`, {
          headers: { Authorization: `Bearer ${user.token}` },
        })

        if (res.status === 404) {
          setConfig(null)
          setMode("form")
          return
        }

        if (!res.ok) throw new Error("Failed to load AI settings.")

        const data: AIConfigResponse = await res.json()
        setConfig(data)
        setMode("view")
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load AI settings.")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [user])

  const handleSaveSuccess = (data: AIConfigResponse) => {
    setConfig(data)
    setMode("view")
  }

  const handleReset = async () => {
    if (!user?.token) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      })
      setConfig(null)
      setMode("form")
      toast.success("Configuration removed.")
    } catch {
      toast.error("Failed to remove configuration.")
    }
  }

  const formInitialValues: AIConfigForm = config
    ? {
        provider: (config.provider as Provider) ?? "openai",
        model: config.model ?? "",
        api_key: "",
        base_url: config.base_url ?? "",
        temperature: config.temperature ?? 0.2,
      }
    : DEFAULT_FORM

  return (
    <>
      <BreadcrumbNav />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Page header */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background shadow-sm">
              <Settings className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your AI provider and preferences.
              </p>
            </div>
          </div>

          {/* Load error */}
          {loadError && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Unable to load AI settings</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <Card>
              <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading AI settings…
              </CardContent>
            </Card>
          )}

          {/* View: configured summary */}
          {!isLoading && mode === "view" && config && (
            <ConfigSummary
              config={config}
              onEdit={() => setMode("edit")}
              onReset={handleReset}
            />
          )}

          {/* View: new config form */}
          {!isLoading && mode === "form" && (
            <ConfigForm
              isEdit={false}
              initialValues={DEFAULT_FORM}
              onSuccess={handleSaveSuccess}
              token={user?.token}
              setConfig={setConfig}
              config={config}
            />
          )}

          {/* View: edit form */}
          {!isLoading && mode === "edit" && (
            <ConfigForm
              isEdit={true}
              initialValues={formInitialValues}
              onSuccess={handleSaveSuccess}
              onCancel={() => setMode("view")}
              token={user?.token}
              setConfig={setConfig}
              config={config}
            />
          )}
        </div>
      </div>
    </>
  )
}