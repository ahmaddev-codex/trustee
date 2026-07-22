"use client"

import { useState } from "react"
import { TbEye, TbEyeOff } from "react-icons/tb"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function PasswordInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-9", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <TbEyeOff className="size-4" /> : <TbEye className="size-4" />}
      </button>
    </div>
  )
}
