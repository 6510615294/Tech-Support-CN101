"use client";

import { useState } from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  value?: Date;
  onChange: (date: Date) => void;
};

export function DateTimePicker24h({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const current = value && !isNaN(value.getTime()) ? value : undefined;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleDateSelect = (selectedDate?: Date) => {
    if (!selectedDate) return;

    const newDate = new Date(selectedDate);

    if (current) {
      newDate.setHours(current.getHours());
      newDate.setMinutes(current.getMinutes());
    }

    onChange(newDate);
  };

  const handleTimeChange = (type: "hour" | "minute", val: number) => {
    const base = current ? new Date(current) : new Date();

    if (type === "hour") base.setHours(val);
    if (type === "minute") base.setMinutes(val);

    onChange(base); // ✅ return Date
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="items-center">
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={current}
            onSelect={handleDateSelect}
            initialFocus
          />

          {/* Time Picker */}
          <div className="flex sm:h-[300px] divide-x">
            {/* Hours */}
            <ScrollArea className="w-20">
              <div className="flex flex-col p-2">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    size="sm"
                    variant={
                      current?.getHours() === hour
                        ? "default"
                        : "ghost"
                    }
                    onClick={() => handleTimeChange("hour", hour)}
                  >
                    {hour.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Minutes */}
            <ScrollArea className="w-20">
              <div className="flex flex-col p-2">
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    size="sm"
                    variant={
                      current?.getMinutes() === minute
                        ? "default"
                        : "ghost"
                    }
                    onClick={() =>
                      handleTimeChange("minute", minute)
                    }
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
  );
}