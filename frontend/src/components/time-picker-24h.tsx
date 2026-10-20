"use client"

import { useMemo, useState } from "react"
import { ClockIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type TimePicker24hProps = {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

function normalizeTime(value: string) {
    const match = value.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return { hour: undefined, minute: undefined }

    const hour = Number(match[1])
    const minute = Number(match[2])

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return { hour: undefined, minute: undefined }
    }

    return {
        hour: hour >= 0 && hour <= 23 ? hour : undefined,
        minute: minute >= 0 && minute <= 59 ? minute : undefined,
    }
}

function formatTime(hour?: number, minute?: number) {
    if (hour === undefined || minute === undefined) return ""
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
}

export function TimePicker24h({ value, onChange, placeholder = "Select time" }: TimePicker24hProps) {
    const [open, setOpen] = useState(false)

    const hours = useMemo(() => Array.from({ length: 24 }, (_, index) => index), [])
    const minutes = useMemo(() => Array.from({ length: 60 }, (_, index) => index), [])
    const current = normalizeTime(value)

    const setHour = (hour: number) => {
        const next = formatTime(hour, current.minute ?? 0)
        onChange(next)
        setOpen(false)
    }

    const setMinute = (minute: number) => {
        const next = formatTime(current.hour ?? 0, minute)
        onChange(next)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "w-full justify-start gap-2 font-normal",
                        !value && "text-muted-foreground"
                    )}
                >
                    <ClockIcon className="h-4 w-4" />
                    {value || placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-2">
                        <div className="px-1 text-xs font-medium text-muted-foreground">Hour</div>
                        <ScrollArea className="h-56 w-20 rounded-none border border-border">
                            <div className="flex flex-col gap-1 p-1">
                                {hours.map((hour) => (
                                    <Button
                                        key={hour}
                                        type="button"
                                        variant={current.hour === hour ? "default" : "ghost"}
                                        size="sm"
                                        className="w-full justify-center"
                                        onClick={() => setHour(hour)}
                                    >
                                        {hour.toString().padStart(2, "0")}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="px-1 text-xs font-medium text-muted-foreground">Minute</div>
                        <ScrollArea className="h-56 w-20 rounded-none border border-border">
                            <div className="flex flex-col gap-1 p-1">
                                {minutes.map((minute) => (
                                    <Button
                                        key={minute}
                                        type="button"
                                        variant={current.minute === minute ? "default" : "ghost"}
                                        size="sm"
                                        className="w-full justify-center"
                                        onClick={() => setMinute(minute)}
                                    >
                                        {minute.toString().padStart(2, "0")}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
