"use client"

import { useState } from "react"
import { TbCheck, TbChevronDown, TbSearch } from "react-icons/tb"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ComboboxOption {
  value: string
  label: string
}

export function Combobox({
  options,
  value,
  onChange,
  disabled,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results found.",
  className,
}: {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = options.find((o) => o.value === value)
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn("w-full justify-between font-normal", className)}
          />
        }
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <TbChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto p-0">
        <div className="sticky top-0 z-10 border-b bg-popover p-1.5">
          <div className="relative">
            <TbSearch className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-8 text-sm"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">{emptyText}</p>
          ) : (
            filtered.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <span className="flex-1 truncate">{option.label}</span>
                {option.value === value && <TbCheck className="size-4 shrink-0" />}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
