"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
    Bot,
    Check,
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

type Provider = "openai" | "anthropic" | "google" | "custom"

type AICredential = {
    id: string
    name: string
    provider: Provider
    base_url: string
    created_at: string
}

type AIConfig = {
    id: string
    config_name: string
    credential_name: string
    model: string
    temperature: number
    created_at: string
}

type ModelOption = {
    id: string
    name: string
}

type CredentialFormState = {
    name: string
    provider: Provider
    api_key: string
    base_url: string
}

type ConfigFormState = {
    name: string
    model: string
    temperature: number
}

const PROVIDERS: {
    id: Provider
    label: string
    icon: ReactNode
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

const DEFAULT_CREDENTIAL_FORM: CredentialFormState = {
    name: "",
    provider: "openai",
    api_key: "",
    base_url: PROVIDERS[0].defaultBaseUrl,
}

const DEFAULT_CONFIG_FORM: ConfigFormState = {
    name: "",
    model: "",
    temperature: 0.2,
}

function normalizeModelList(data: unknown): ModelOption[] {
    const candidates = Array.isArray(data)
        ? data
        : Array.isArray((data as { models?: unknown })?.models)
            ? (data as { models: unknown[] }).models
            : Array.isArray((data as { data?: unknown })?.data)
                ? (data as { data: unknown[] }).data
                : []

    return candidates
        .map((item) => {
            if (typeof item === "string") {
                return { id: item, name: item }
            }

            if (item && typeof item === "object") {
                const record = item as { id?: unknown; name?: unknown }
                const id = typeof record.id === "string" ? record.id : ""
                if (!id) return null

                return {
                    id,
                    name: typeof record.name === "string" && record.name.trim() ? record.name : id,
                }
            }

            return null
        })
        .filter((item): item is ModelOption => item !== null)
}

function getProviderMeta(provider: Provider) {
    return PROVIDERS.find((item) => item.id === provider) ?? PROVIDERS[0]
}

function ProviderCard({
    provider,
    selected,
    onClick,
}: {
    provider: (typeof PROVIDERS)[number]
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

function ModelCombobox({
    value,
    onChange,
    models,
    disabled,
}: {
    value: string
    onChange: (value: string) => void
    models: ModelOption[]
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value)

    useEffect(() => {
        setInputValue(value)
    }, [value])

    const handleInputChange = (nextValue: string) => {
        setInputValue(nextValue)
        onChange(nextValue)
    }

    const handleSelect = (nextValue: string) => {
        setInputValue(nextValue)
        onChange(nextValue)
        setOpen(false)
    }

    const selectedLabel = models.find((item) => item.id === value)?.name ?? value

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
                        {selectedLabel || "Type or select a model"}
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
                                {models.map((model) => (
                                    <CommandItem
                                        key={model.id}
                                        value={model.id}
                                        onSelect={handleSelect}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === model.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="truncate">{model.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default function SettingsPage() {
    const { user } = useAuth()

    const [credentials, setCredentials] = useState<AICredential[]>([])
    const [configs, setConfigs] = useState<AIConfig[]>([])
    const [selectedCredentialId, setSelectedCredentialId] = useState("")
    const [credentialCreateForm, setCredentialCreateForm] = useState<CredentialFormState>(
        DEFAULT_CREDENTIAL_FORM
    )
    const [credentialEditForm, setCredentialEditForm] = useState<CredentialFormState>(
        DEFAULT_CREDENTIAL_FORM
    )
    const [configCreateForm, setConfigCreateForm] = useState<ConfigFormState>(
        DEFAULT_CONFIG_FORM
    )
    const [configEditForm, setConfigEditForm] = useState<ConfigFormState>(
        DEFAULT_CONFIG_FORM
    )
    const [editingCredentialId, setEditingCredentialId] = useState<string | null>(null)
    const [editingConfigId, setEditingConfigId] = useState<string | null>(null)
    const [credentialCreateErrors, setCredentialCreateErrors] = useState<
        Partial<Record<keyof CredentialFormState, string>>
    >({})
    const [credentialEditErrors, setCredentialEditErrors] = useState<
        Partial<Record<keyof CredentialFormState, string>>
    >({})
    const [configCreateErrors, setConfigCreateErrors] = useState<
        Partial<Record<keyof ConfigFormState, string>>
    >({})
    const [configEditErrors, setConfigEditErrors] = useState<
        Partial<Record<keyof ConfigFormState, string>>
    >({})
    const [modelOptionsByCredential, setModelOptionsByCredential] = useState<
        Record<string, ModelOption[]>
    >({})
    const [modelFetchErrorsByCredential, setModelFetchErrorsByCredential] = useState<
        Record<string, string>
    >({})
    const [loadingCredentials, setLoadingCredentials] = useState(true)
    const [loadingConfigs, setLoadingConfigs] = useState(false)
    const [loadError, setLoadError] = useState("")
    const [savingCredential, setSavingCredential] = useState(false)
    const [savingConfig, setSavingConfig] = useState(false)
    const [fetchingModelsFor, setFetchingModelsFor] = useState<string | null>(null)
    const [deletingCredentialId, setDeletingCredentialId] = useState<string | null>(null)
    const [deletingConfigId, setDeletingConfigId] = useState<string | null>(null)

    const selectedCredential = useMemo(
        () => credentials.find((credential) => credential.id === selectedCredentialId) ?? null,
        [credentials, selectedCredentialId]
    )

    const activeModelOptions = modelOptionsByCredential[selectedCredentialId] ?? []
    const activeModelError = modelFetchErrorsByCredential[selectedCredentialId] ?? ""

    const resetCredentialCreateForm = useCallback(() => {
        setCredentialCreateForm(DEFAULT_CREDENTIAL_FORM)
        setCredentialCreateErrors({})
    }, [])

    const resetConfigCreateForm = useCallback(() => {
        setConfigCreateForm(DEFAULT_CONFIG_FORM)
        setConfigCreateErrors({})
    }, [])

    const loadConfigs = useCallback(
        async (credentialId: string) => {
            if (!user?.token || !credentialId) {
                setConfigs([])
                return
            }

            setLoadingConfigs(true)
            setLoadError("")
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/ai/configs/${credentialId}`,
                    {
                        headers: { Authorization: `Bearer ${user.token}` },
                    }
                )

                if (!response.ok) {
                    throw new Error("Failed to load model profiles.")
                }

                const data = await response.json()
                setConfigs(Array.isArray(data) ? (data as AIConfig[]) : [])
            } catch (error) {
                setConfigs([])
                setLoadError(error instanceof Error ? error.message : "Failed to load model profiles.")
            } finally {
                setLoadingConfigs(false)
            }
        },
        [user?.token]
    )

    const loadCredentials = useCallback(async () => {
        if (!user?.token) {
            setLoadingCredentials(false)
            return
        }

        setLoadingCredentials(true)
        setLoadError("")

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai`, {
                headers: { Authorization: `Bearer ${user.token}` },
            })

            if (!response.ok) {
                throw new Error("Failed to load credential profiles.")
            }

            const data = await response.json()
            const nextCredentials = Array.isArray(data) ? (data as AICredential[]) : []
            setCredentials(nextCredentials)

            setSelectedCredentialId((current) => {
                if (nextCredentials.length === 0) return ""
                const existing = nextCredentials.some((credential) => credential.id === current)
                return existing ? current : nextCredentials[0].id
            })
        } catch (error) {
            setLoadError(
                error instanceof Error ? error.message : "Failed to load credential profiles."
            )
        } finally {
            setLoadingCredentials(false)
        }
    }, [user?.token])

    useEffect(() => {
        void loadCredentials()
    }, [loadCredentials])

    useEffect(() => {
        setEditingConfigId(null)
        setConfigEditForm(DEFAULT_CONFIG_FORM)
        setConfigEditErrors({})

        if (!selectedCredentialId) {
            setConfigs([])
            return
        }

        resetConfigCreateForm()
        void loadConfigs(selectedCredentialId)
    }, [loadConfigs, resetConfigCreateForm, selectedCredentialId])

    useEffect(() => {
        if (!editingCredentialId) {
            return
        }

        const credential = credentials.find((item) => item.id === editingCredentialId)
        if (!credential) {
            setEditingCredentialId(null)
            return
        }

        setCredentialEditForm({
            name: credential.name,
            provider: credential.provider,
            api_key: "",
            base_url: credential.base_url || getProviderMeta(credential.provider).defaultBaseUrl,
        })
        setCredentialEditErrors({})
    }, [credentials, editingCredentialId])

    useEffect(() => {
        if (!editingConfigId) {
            return
        }

        const config = configs.find((item) => item.id === editingConfigId)
        if (!config) {
            setEditingConfigId(null)
            return
        }

        setConfigEditForm({
            name: config.config_name,
            model: config.model,
            temperature: config.temperature,
        })
        setConfigEditErrors({})
    }, [configs, editingConfigId])

    const validateCredentialForm = (
        form: CredentialFormState,
        isEdit: boolean
    ): boolean => {
        const nextErrors: Partial<Record<keyof CredentialFormState, string>> = {}

        if (!form.name.trim()) {
            nextErrors.name = "Credential name is required."
        }

        if (!form.provider) {
            nextErrors.provider = "Select a provider."
        }

        if (form.provider === "custom" && !form.base_url.trim()) {
            nextErrors.base_url = "Base URL is required for custom providers."
        }

        if (!isEdit && !form.api_key.trim()) {
            nextErrors.api_key = "API key is required for first-time setup."
        }

        if (isEdit && form.provider === "custom" && !form.base_url.trim()) {
            nextErrors.base_url = "Base URL is required for custom providers."
        }

        if (isEdit) {
            setCredentialEditErrors(nextErrors)
        } else {
            setCredentialCreateErrors(nextErrors)
        }

        return Object.keys(nextErrors).length === 0
    }

    const validateConfigForm = (form: ConfigFormState, isEdit: boolean): boolean => {
        const nextErrors: Partial<Record<keyof ConfigFormState, string>> = {}

        if (!form.name.trim()) {
            nextErrors.name = "Model profile name is required."
        }

        if (!form.model.trim()) {
            nextErrors.model = "Model is required."
        }

        if (form.temperature < 0 || form.temperature > 2) {
            nextErrors.temperature = "Must be between 0 and 2."
        }

        if (isEdit) {
            setConfigEditErrors(nextErrors)
        } else {
            setConfigCreateErrors(nextErrors)
        }

        return Object.keys(nextErrors).length === 0
    }

    const handleSelectCredential = (credentialId: string) => {
        setSelectedCredentialId(credentialId)
        setEditingCredentialId(null)
        setCredentialEditErrors({})
        resetConfigCreateForm()
    }

    const handleFetchModels = async (credentialId: string) => {
        if (!user?.token) {
            return
        }

        setFetchingModelsFor(credentialId)
        setModelFetchErrorsByCredential((current) => ({ ...current, [credentialId]: "" }))

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/ai/${credentialId}/models`,
                {
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            )

            if (!response.ok) {
                throw new Error("Failed to fetch models.")
            }

            const data = await response.json()
            const models = normalizeModelList(data)

            setModelOptionsByCredential((current) => ({
                ...current,
                [credentialId]: models,
            }))

            if (models.length === 0) {
                setModelFetchErrorsByCredential((current) => ({
                    ...current,
                    [credentialId]: "No models returned from provider.",
                }))
            } else {
                toast.success("Models fetched", {
                    description: `${models.length} models available for this credential profile.`,
                })
            }
        } catch (error) {
            setModelFetchErrorsByCredential((current) => ({
                ...current,
                [credentialId]:
                    error instanceof Error ? error.message : "Failed to fetch models.",
            }))
        } finally {
            setFetchingModelsFor(null)
        }
    }

    const handleCreateCredential = async () => {
        if (!user?.token) return
        if (!validateCredentialForm(credentialCreateForm, false)) return

        setSavingCredential(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: credentialCreateForm.name.trim(),
                    provider: credentialCreateForm.provider,
                    api_key: credentialCreateForm.api_key.trim(),
                    base_url:
                        credentialCreateForm.provider === "custom"
                            ? credentialCreateForm.base_url.trim()
                            : getProviderMeta(credentialCreateForm.provider).defaultBaseUrl,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to save credential profile.")
            }

            const data = (await response.json()) as AICredential
            toast.success("Credential profile created", {
                description: "You can now add model profiles under this credential.",
            })

            setCredentials((current) => [data, ...current])
            setSelectedCredentialId(data.id)
            resetCredentialCreateForm()
            setEditingCredentialId(null)
        } catch (error) {
            toast.error("Failed to save credential profile", {
                description: error instanceof Error ? error.message : "Something went wrong.",
            })
        } finally {
            setSavingCredential(false)
        }
    }

    const handleUpdateCredential = async () => {
        if (!user?.token || !editingCredentialId) return
        if (!validateCredentialForm(credentialEditForm, true)) return

        setSavingCredential(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/ai/${editingCredentialId}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: credentialEditForm.name.trim(),
                        provider: credentialEditForm.provider,
                        api_key: credentialEditForm.api_key.trim(),
                        base_url:
                            credentialEditForm.provider === "custom"
                                ? credentialEditForm.base_url.trim()
                                : getProviderMeta(credentialEditForm.provider).defaultBaseUrl,
                    }),
                }
            )

            if (!response.ok) {
                throw new Error("Failed to update credential profile.")
            }

            const data = (await response.json()) as AICredential
            toast.success("Credential profile updated", {
                description: "The credential name and provider settings were saved.",
            })

            setCredentials((current) =>
                current.map((credential) => (credential.id === data.id ? data : credential))
            )
            setEditingCredentialId(null)
            setCredentialEditForm(DEFAULT_CREDENTIAL_FORM)
        } catch (error) {
            toast.error("Failed to update credential profile", {
                description: error instanceof Error ? error.message : "Something went wrong.",
            })
        } finally {
            setSavingCredential(false)
        }
    }

    const handleDeleteCredential = async (credentialId: string) => {
        if (!user?.token) return

        setDeletingCredentialId(credentialId)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/ai/${credentialId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            )

            if (!response.ok) {
                throw new Error("Failed to delete credential profile.")
            }

            const nextCredentials = credentials.filter((credential) => credential.id !== credentialId)
            setCredentials(nextCredentials)
            if (selectedCredentialId === credentialId) {
                setSelectedCredentialId(nextCredentials[0]?.id ?? "")
            }

            setModelOptionsByCredential((current) => {
                const next = { ...current }
                delete next[credentialId]
                return next
            })
            setModelFetchErrorsByCredential((current) => {
                const next = { ...current }
                delete next[credentialId]
                return next
            })

            if (editingCredentialId === credentialId) {
                setEditingCredentialId(null)
            }

            setConfigs([])
            toast.success("Credential profile removed")
        } catch (error) {
            toast.error("Failed to remove credential profile", {
                description: error instanceof Error ? error.message : "Something went wrong.",
            })
        } finally {
            setDeletingCredentialId(null)
        }
    }

    const handleCreateConfig = async () => {
        if (!user?.token || !selectedCredentialId) return
        if (!validateConfigForm(configCreateForm, false)) return

        setSavingConfig(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/ai/configs/${selectedCredentialId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: configCreateForm.name.trim(),
                        credential_id: selectedCredentialId,
                        model: configCreateForm.model.trim(),
                        temperature: configCreateForm.temperature,
                    }),
                }
            )

            if (!response.ok) {
                throw new Error("Failed to save model profile.")
            }

            toast.success("Model profile created", {
                description: "You can create more profiles or edit the one you just made.",
            })
            await loadConfigs(selectedCredentialId)
            resetConfigCreateForm()
            setEditingConfigId(null)
        } catch (error) {
            toast.error("Failed to save model profile", {
                description: error instanceof Error ? error.message : "Something went wrong.",
            })
        } finally {
            setSavingConfig(false)
        }
    }

    const handleUpdateConfig = async () => {
        if (!user?.token || !editingConfigId || !selectedCredentialId) return
        if (!validateConfigForm(configEditForm, true)) return

        setSavingConfig(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/ai/configs/${editingConfigId}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: configEditForm.name.trim(),
                        credential_id: selectedCredentialId,
                        model: configEditForm.model.trim(),
                        temperature: configEditForm.temperature,
                    }),
                }
            )

            if (!response.ok) {
                throw new Error("Failed to update model profile.")
            }

            toast.success("Model profile updated", {
                description: "The selected model and temperature were saved.",
            })
            await loadConfigs(selectedCredentialId)
            setEditingConfigId(null)
            setConfigEditForm(DEFAULT_CONFIG_FORM)
        } catch (error) {
            toast.error("Failed to update model profile", {
                description: error instanceof Error ? error.message : "Something went wrong.",
            })
        } finally {
            setSavingConfig(false)
        }
    }

    const handleDeleteConfig = async (configId: string) => {
        if (!user?.token) return

        setDeletingConfigId(configId)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/ai/configs/${configId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            )

            if (!response.ok) {
                throw new Error("Failed to delete model profile.")
            }

            await loadConfigs(selectedCredentialId)
            if (editingConfigId === configId) {
                setEditingConfigId(null)
            }
            toast.success("Model profile removed")
        } catch (error) {
            toast.error("Failed to remove model profile", {
                description: error instanceof Error ? error.message : "Something went wrong.",
            })
        } finally {
            setDeletingConfigId(null)
        }
    }

    const startEditCredential = (credential: AICredential) => {
        setSelectedCredentialId(credential.id)
        setEditingCredentialId(credential.id)
        setCredentialEditForm({
            name: credential.name,
            provider: credential.provider,
            api_key: "",
            base_url: credential.base_url || getProviderMeta(credential.provider).defaultBaseUrl,
        })
        setCredentialEditErrors({})
    }

    const startEditConfig = (config: AIConfig) => {
        setEditingConfigId(config.id)
        setConfigEditForm({
            name: config.config_name,
            model: config.model,
            temperature: config.temperature,
        })
        setConfigEditErrors({})
    }

    const selectedCredentialModels = modelOptionsByCredential[selectedCredentialId] ?? []

    return (
        <>
            <BreadcrumbNav />
            <div className="flex-1 p-6">
                <div className="mx-auto max-w-6xl space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background shadow-sm">
                            <Settings className="h-4.5 w-4.5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold leading-tight">AI Settings</h1>
                            <p className="text-sm text-muted-foreground">
                                Create credential profiles first, then attach named model profiles per
                                provider.
                            </p>
                        </div>
                    </div>

                    <Alert className="border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100">
                        <Info className="h-4 w-4 !text-sky-600 dark:!text-sky-300" />
                        <AlertTitle>Two-step AI setup</AlertTitle>
                        <AlertDescription>
                            First save a credential profile with a name, provider, and API key.
                            After that, create as many model profiles as you need and tune each one
                            independently.
                        </AlertDescription>
                    </Alert>

                    {loadError && (
                        <Alert variant="destructive">
                            <TriangleAlert className="h-4 w-4" />
                            <AlertTitle>Unable to load AI settings</AlertTitle>
                            <AlertDescription>{loadError}</AlertDescription>
                        </Alert>
                    )}

                    {loadingCredentials ? (
                        <Card>
                            <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading credential profiles…
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                            <div className="space-y-6">
                                <Card className="border-slate-200/70 bg-background/95 shadow-sm">
                                    <CardHeader className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <Sparkles className="h-4 w-4 text-primary" />
                                                    Credential profiles
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    Save reusable provider credentials before creating model-specific
                                                    configs.
                                                </CardDescription>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {credentials.length} saved
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <form
                                            className="space-y-5 rounded-xl border bg-muted/25 p-4"
                                            onSubmit={(event) => {
                                                event.preventDefault()
                                                void handleCreateCredential()
                                            }}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <h2 className="text-sm font-semibold">Create credential profile</h2>
                                                    <p className="text-xs text-muted-foreground">
                                                    </p>
                                                </div>
                                                <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                                                    New
                                                </Badge>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="credential-name-create">Credential name</Label>
                                                <Input
                                                    id="credential-name-create"
                                                    placeholder='e.g. "OpenAI grading"'
                                                    value={credentialCreateForm.name}
                                                    onChange={(event) =>
                                                        setCredentialCreateForm((current) => ({
                                                            ...current,
                                                            name: event.target.value,
                                                        }))
                                                    }
                                                    className={cn(credentialCreateErrors.name && "border-destructive")}
                                                />
                                                {credentialCreateErrors.name && (
                                                    <p className="text-xs text-destructive">{credentialCreateErrors.name}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Provider</Label>
                                                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                                    {PROVIDERS.map((provider) => (
                                                        <ProviderCard
                                                            key={provider.id}
                                                            provider={provider}
                                                            selected={credentialCreateForm.provider === provider.id}
                                                            onClick={() =>
                                                                setCredentialCreateForm((current) => ({
                                                                    ...current,
                                                                    provider: provider.id,
                                                                    base_url: provider.defaultBaseUrl,
                                                                }))
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                                {credentialCreateErrors.provider && (
                                                    <p className="text-xs text-destructive">
                                                        {credentialCreateErrors.provider}
                                                    </p>
                                                )}
                                            </div>

                                            {credentialCreateForm.provider === "custom" && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="credential-base-url-create">Base URL</Label>
                                                    <Input
                                                        id="credential-base-url-create"
                                                        placeholder="https://api.example.com/v1"
                                                        value={credentialCreateForm.base_url}
                                                        onChange={(event) =>
                                                            setCredentialCreateForm((current) => ({
                                                                ...current,
                                                                base_url: event.target.value,
                                                            }))
                                                        }
                                                        className={cn(credentialCreateErrors.base_url && "border-destructive")}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Any OpenAI-compatible endpoint.
                                                    </p>
                                                    {credentialCreateErrors.base_url && (
                                                        <p className="text-xs text-destructive">
                                                            {credentialCreateErrors.base_url}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="credential-api-key-create">API key</Label>
                                                <Input
                                                    id="credential-api-key-create"
                                                    type="password"
                                                    autoComplete="off"
                                                    placeholder="Paste your API key"
                                                    value={credentialCreateForm.api_key}
                                                    onChange={(event) =>
                                                        setCredentialCreateForm((current) => ({
                                                            ...current,
                                                            api_key: event.target.value,
                                                        }))
                                                    }
                                                    className={cn(credentialCreateErrors.api_key && "border-destructive")}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    {getProviderMeta(credentialCreateForm.provider).hint}
                                                </p>
                                                {credentialCreateErrors.api_key && (
                                                    <p className="text-xs text-destructive">
                                                        {credentialCreateErrors.api_key}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex justify-end">
                                                <Button type="submit" disabled={savingCredential}>
                                                    {savingCredential ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Saving…
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="mr-2 h-3.5 w-3.5" />
                                                            Create credential
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>

                                        <div className="space-y-3">
                                            {credentials.length === 0 ? (
                                                <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
                                                    No credential profiles yet. Create one above to unlock model
                                                    configuration.
                                                </div>
                                            ) : (
                                                credentials.map((credential) => {
                                                    const providerMeta = getProviderMeta(credential.provider)
                                                    const isSelected = selectedCredentialId === credential.id

                                                    return (
                                                        <Card
                                                            key={credential.id}
                                                            className={cn(
                                                                "mx-auto w-full max-w-xl overflow-hidden transition-all",
                                                                isSelected
                                                                    ? "border-primary/60 bg-primary/5 shadow-sm"
                                                                    : "border-border"
                                                            )}
                                                        >
                                                            <CardContent className="space-y-4 p-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSelectCredential(credential.id)}
                                                                    className="flex w-full items-start justify-between gap-4 text-left"
                                                                >
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <h3 className="text-sm font-semibold">
                                                                                {credential.name}
                                                                            </h3>
                                                                            {isSelected && (
                                                                                <Badge className="text-[10px] uppercase tracking-wide">
                                                                                    Active
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <Badge variant="outline" className="shrink-0 capitalize text-xs">
                                                                        {credential.provider}
                                                                    </Badge>
                                                                </button>

                                                                <div className="flex flex-wrap justify-end gap-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => startEditCredential(credential)}
                                                                    >
                                                                        <Pencil className="mr-2 h-3.5 w-3.5" />
                                                                        Edit
                                                                    </Button>

                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="text-destructive hover:text-destructive"
                                                                            >
                                                                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                                                Delete
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>
                                                                                    Delete credential profile?
                                                                                </AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    This removes the saved API key and any model
                                                                                    profiles attached to this credential.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => handleDeleteCredential(credential.id)}
                                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                    disabled={deletingCredentialId === credential.id}
                                                                                >
                                                                                    {deletingCredentialId === credential.id ? "Deleting…" : "Delete"}
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )
                                                })
                                            )}
                                        </div>

                                        <Dialog
                                            open={Boolean(editingCredentialId)}
                                            onOpenChange={(open) => {
                                                if (!open) {
                                                    setEditingCredentialId(null)
                                                    setCredentialEditErrors({})
                                                }
                                            }}
                                        >
                                            <DialogContent className="sm:max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Edit credential profile</DialogTitle>
                                                    <DialogDescription>
                                                        Rename the credential or update provider details.
                                                        Leave the API key blank to keep the current one.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <form
                                                    className="space-y-5"
                                                    onSubmit={(event) => {
                                                        event.preventDefault()
                                                        void handleUpdateCredential()
                                                    }}
                                                >
                                                    <div className="space-y-2">
                                                        <Label htmlFor="credential-name-edit">Credential name</Label>
                                                        <Input
                                                            id="credential-name-edit"
                                                            value={credentialEditForm.name}
                                                            onChange={(event) =>
                                                                setCredentialEditForm((current) => ({
                                                                    ...current,
                                                                    name: event.target.value,
                                                                }))
                                                            }
                                                            className={cn(credentialEditErrors.name && "border-destructive")}
                                                        />
                                                        {credentialEditErrors.name && (
                                                            <p className="text-xs text-destructive">{credentialEditErrors.name}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Provider</Label>
                                                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                                            {PROVIDERS.map((provider) => (
                                                                <ProviderCard
                                                                    key={provider.id}
                                                                    provider={provider}
                                                                    selected={credentialEditForm.provider === provider.id}
                                                                    onClick={() =>
                                                                        setCredentialEditForm((current) => ({
                                                                            ...current,
                                                                            provider: provider.id,
                                                                            base_url: provider.defaultBaseUrl,
                                                                        }))
                                                                    }
                                                                />
                                                            ))}
                                                        </div>
                                                        {credentialEditErrors.provider && (
                                                            <p className="text-xs text-destructive">
                                                                {credentialEditErrors.provider}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {credentialEditForm.provider === "custom" && (
                                                        <div className="space-y-2">
                                                            <Label htmlFor="credential-base-url-edit">Base URL</Label>
                                                            <Input
                                                                id="credential-base-url-edit"
                                                                placeholder="https://api.example.com/v1"
                                                                value={credentialEditForm.base_url}
                                                                onChange={(event) =>
                                                                    setCredentialEditForm((current) => ({
                                                                        ...current,
                                                                        base_url: event.target.value,
                                                                    }))
                                                                }
                                                                className={cn(credentialEditErrors.base_url && "border-destructive")}
                                                            />
                                                            {credentialEditErrors.base_url && (
                                                                <p className="text-xs text-destructive">
                                                                    {credentialEditErrors.base_url}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="space-y-2">
                                                        <Label htmlFor="credential-api-key-edit">API key</Label>
                                                        <Input
                                                            id="credential-api-key-edit"
                                                            type="password"
                                                            autoComplete="off"
                                                            placeholder="Leave blank to keep current key"
                                                            value={credentialEditForm.api_key}
                                                            onChange={(event) =>
                                                                setCredentialEditForm((current) => ({
                                                                    ...current,
                                                                    api_key: event.target.value,
                                                                }))
                                                            }
                                                            className={cn(credentialEditErrors.api_key && "border-destructive")}
                                                        />
                                                        {credentialEditErrors.api_key && (
                                                            <p className="text-xs text-destructive">
                                                                {credentialEditErrors.api_key}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <DialogFooter>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingCredentialId(null)
                                                                setCredentialEditErrors({})
                                                            }}
                                                            disabled={savingCredential}
                                                        >
                                                            <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                                            Cancel
                                                        </Button>
                                                        <Button type="submit" disabled={savingCredential}>
                                                            {savingCredential ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    Saving…
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Save className="mr-2 h-3.5 w-3.5" />
                                                                    Save changes
                                                                </>
                                                            )}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card className="border-slate-200/70 bg-background/95 shadow-sm">
                                    <CardHeader className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <Bot className="h-4 w-4 text-primary" />
                                                    Model profiles
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    Create separate model configs for the currently selected credential.
                                                </CardDescription>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {configs.length} loaded
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {!selectedCredential ? (
                                            <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
                                                Select or create a credential profile first. Model profiles live under
                                                a credential and can each use a different model and temperature.
                                            </div>
                                        ) : (
                                            <>
                                                <div className="rounded-xl border bg-muted/25 p-4">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                Active credential
                                                            </p>
                                                            <h3 className="mt-1 text-sm font-semibold">
                                                                {selectedCredential.name}
                                                            </h3>
                                                            <p className="text-xs text-muted-foreground">
                                                                {getProviderMeta(selectedCredential.provider).label}
                                                                {selectedCredential.base_url
                                                                    ? `: ${selectedCredential.base_url}`
                                                                    : ""}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleFetchModels(selectedCredential.id)}
                                                            disabled={fetchingModelsFor === selectedCredential.id}
                                                        >
                                                            {fetchingModelsFor === selectedCredential.id ? (
                                                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                                                            )}
                                                            {fetchingModelsFor === selectedCredential.id
                                                                ? "Fetching…"
                                                                : "Fetch models"}
                                                        </Button>
                                                    </div>
                                                    {activeModelError && (
                                                        <p className="mt-3 flex items-center gap-1 text-xs text-destructive">
                                                            <TriangleAlert className="h-3 w-3 shrink-0" />
                                                            {activeModelError}
                                                        </p>
                                                    )}
                                                    {selectedCredentialModels.length > 0 && !activeModelError && (
                                                        <p className="mt-3 text-xs text-muted-foreground">
                                                            {selectedCredentialModels.length} models loaded for this credential.
                                                        </p>
                                                    )}
                                                </div>

                                                <form
                                                    className="space-y-5 rounded-xl border bg-muted/25 p-4"
                                                    onSubmit={(event) => {
                                                        event.preventDefault()
                                                        void handleCreateConfig()
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div>
                                                            <h2 className="text-sm font-semibold">Create model profile</h2>
                                                            <p className="text-xs text-muted-foreground">
                                                                Give it a name so you can reuse the same credential with
                                                                different models.
                                                            </p>
                                                        </div>
                                                        <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                                                            New
                                                        </Badge>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="config-name-create">Model profile name</Label>
                                                        <Input
                                                            id="config-name-create"
                                                            placeholder='e.g. "Fast grader"'
                                                            value={configCreateForm.name}
                                                            onChange={(event) =>
                                                                setConfigCreateForm((current) => ({
                                                                    ...current,
                                                                    name: event.target.value,
                                                                }))
                                                            }
                                                            className={cn(configCreateErrors.name && "border-destructive")}
                                                        />
                                                        {configCreateErrors.name && (
                                                            <p className="text-xs text-destructive">{configCreateErrors.name}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <Label>Model</Label>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => void handleFetchModels(selectedCredential.id)}
                                                                disabled={fetchingModelsFor === selectedCredential.id}
                                                                className="h-7 gap-1.5 text-xs text-muted-foreground"
                                                            >
                                                                {fetchingModelsFor === selectedCredential.id ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <RefreshCw className="h-3 w-3" />
                                                                )}
                                                                {fetchingModelsFor === selectedCredential.id
                                                                    ? "Fetching…"
                                                                    : "Fetch models"}
                                                            </Button>
                                                        </div>

                                                        <ModelCombobox
                                                            value={configCreateForm.model}
                                                            onChange={(value) =>
                                                                setConfigCreateForm((current) => ({
                                                                    ...current,
                                                                    model: value,
                                                                }))
                                                            }
                                                            models={activeModelOptions}
                                                        />

                                                        {configCreateErrors.model && (
                                                            <p className="text-xs text-destructive">{configCreateErrors.model}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label>Temperature</Label>
                                                            <span className="min-w-[2.5rem] text-right text-sm font-medium tabular-nums">
                                                                {configCreateForm.temperature.toFixed(1)}
                                                            </span>
                                                        </div>
                                                        <Slider
                                                            min={0}
                                                            max={2}
                                                            step={0.1}
                                                            value={[configCreateForm.temperature]}
                                                            onValueChange={([value]) =>
                                                                setConfigCreateForm((current) => ({
                                                                    ...current,
                                                                    temperature: value,
                                                                }))
                                                            }
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>Deterministic</span>
                                                            <span>Creative</span>
                                                        </div>
                                                        {configCreateErrors.temperature && (
                                                            <p className="text-xs text-destructive">
                                                                {configCreateErrors.temperature}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <Button type="submit" disabled={savingConfig}>
                                                            {savingConfig ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    Saving…
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Save className="mr-2 h-3.5 w-3.5" />
                                                                    Create profile
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </form>

                                                {loadingConfigs ? (
                                                    <Card>
                                                        <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Loading model profiles…
                                                        </CardContent>
                                                    </Card>
                                                ) : configs.length === 0 ? (
                                                    <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
                                                        No model profiles yet for this credential. Create the first one
                                                        above.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {configs.map((config) => (
                                                            <Card
                                                                key={config.id}
                                                                className={cn(
                                                                    "overflow-hidden transition-all",
                                                                    editingConfigId === config.id
                                                                        ? "border-primary/60 bg-primary/5 shadow-sm"
                                                                        : "border-border"
                                                                )}
                                                            >
                                                                <CardContent className="space-y-4 p-4">
                                                                    <div className="flex items-start justify-between gap-4">
                                                                        <div className="space-y-1.5">
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <h3 className="text-sm font-semibold">
                                                                                    {config.config_name}
                                                                                </h3>
                                                                                {editingConfigId === config.id && (
                                                                                    <Badge className="text-[10px] uppercase tracking-wide">
                                                                                        Editing
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {config.model}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Temperature {config.temperature.toFixed(1)}
                                                                            </p>
                                                                        </div>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {config.credential_name}
                                                                        </Badge>
                                                                    </div>

                                                                    <div className="flex flex-wrap justify-end gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => startEditConfig(config)}
                                                                        >
                                                                            <Pencil className="mr-2 h-3.5 w-3.5" />
                                                                            Edit
                                                                        </Button>

                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="text-destructive hover:text-destructive"
                                                                                >
                                                                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                                                    Delete
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Delete model profile?</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        This removes only the saved model settings.
                                                                                        The credential profile stays intact.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        onClick={() => handleDeleteConfig(config.id)}
                                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                        disabled={deletingConfigId === config.id}
                                                                                    >
                                                                                        {deletingConfigId === config.id ? "Deleting…" : "Delete"}
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                )}

                                                <Dialog
                                                    open={Boolean(editingConfigId)}
                                                    onOpenChange={(open) => {
                                                        if (!open) {
                                                            setEditingConfigId(null)
                                                            setConfigEditErrors({})
                                                        }
                                                    }}
                                                >
                                                    <DialogContent className="sm:max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit model profile</DialogTitle>
                                                            <DialogDescription>
                                                                Change the profile name, model, or temperature.
                                                                You can fetch models again from the active credential.
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <form
                                                            className="space-y-5"
                                                            onSubmit={(event) => {
                                                                event.preventDefault()
                                                                void handleUpdateConfig()
                                                            }}
                                                        >
                                                            <div className="space-y-2">
                                                                <Label htmlFor="config-name-edit">Model profile name</Label>
                                                                <Input
                                                                    id="config-name-edit"
                                                                    value={configEditForm.name}
                                                                    onChange={(event) =>
                                                                        setConfigEditForm((current) => ({
                                                                            ...current,
                                                                            name: event.target.value,
                                                                        }))
                                                                    }
                                                                    className={cn(configEditErrors.name && "border-destructive")}
                                                                />
                                                                {configEditErrors.name && (
                                                                    <p className="text-xs text-destructive">{configEditErrors.name}</p>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <Label>Model</Label>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => void handleFetchModels(selectedCredential.id)}
                                                                        disabled={fetchingModelsFor === selectedCredential.id}
                                                                        className="h-7 gap-1.5 text-xs text-muted-foreground"
                                                                    >
                                                                        {fetchingModelsFor === selectedCredential.id ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                        ) : (
                                                                            <RefreshCw className="h-3 w-3" />
                                                                        )}
                                                                        {fetchingModelsFor === selectedCredential.id
                                                                            ? "Fetching…"
                                                                            : "Fetch models"}
                                                                    </Button>
                                                                </div>

                                                                <ModelCombobox
                                                                    value={configEditForm.model}
                                                                    onChange={(value) =>
                                                                        setConfigEditForm((current) => ({
                                                                            ...current,
                                                                            model: value,
                                                                        }))
                                                                    }
                                                                    models={selectedCredentialModels}
                                                                />

                                                                {configEditErrors.model && (
                                                                    <p className="text-xs text-destructive">{configEditErrors.model}</p>
                                                                )}
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <Label>Temperature</Label>
                                                                    <span className="min-w-[2.5rem] text-right text-sm font-medium tabular-nums">
                                                                        {configEditForm.temperature.toFixed(1)}
                                                                    </span>
                                                                </div>
                                                                <Slider
                                                                    min={0}
                                                                    max={2}
                                                                    step={0.1}
                                                                    value={[configEditForm.temperature]}
                                                                    onValueChange={([value]) =>
                                                                        setConfigEditForm((current) => ({
                                                                            ...current,
                                                                            temperature: value,
                                                                        }))
                                                                    }
                                                                />
                                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                                    <span>Deterministic</span>
                                                                    <span>Creative</span>
                                                                </div>
                                                                {configEditErrors.temperature && (
                                                                    <p className="text-xs text-destructive">
                                                                        {configEditErrors.temperature}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <DialogFooter>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setEditingConfigId(null)
                                                                        setConfigEditErrors({})
                                                                    }}
                                                                    disabled={savingConfig}
                                                                >
                                                                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                                                    Cancel
                                                                </Button>
                                                                <Button type="submit" disabled={savingConfig}>
                                                                    {savingConfig ? (
                                                                        <>
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                            Saving…
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Save className="mr-2 h-3.5 w-3.5" />
                                                                            Save changes
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </DialogFooter>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">How it works</CardTitle>
                                        <CardDescription>
                                            The page is split by the way the backend stores AI settings.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                                        <div className="rounded-lg bg-muted/40 p-3">
                                            1. Create a credential profile with a name, provider, API key, and base
                                            URL if needed.
                                        </div>
                                        <div className="rounded-lg bg-muted/40 p-3">
                                            2. Select that credential and fetch the provider models when you are
                                            ready.
                                        </div>
                                        <div className="rounded-lg bg-muted/40 p-3">
                                            3. Create multiple named model profiles, each with its own temperature
                                            and model choice.
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
