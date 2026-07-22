"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { TbCircleCheck, TbInfoCircle, TbAlertTriangle, TbOctagon, TbLoader2 } from "react-icons/tb"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      className="toaster group"
      icons={{
        success: (
          <TbCircleCheck className="size-4 text-green-600 dark:text-green-400" />
        ),
        info: (
          <TbInfoCircle className="size-4 text-cyan-600 dark:text-cyan" />
        ),
        warning: (
          <TbAlertTriangle className="size-4 text-amber-500" />
        ),
        error: (
          <TbOctagon className="size-4 text-destructive" />
        ),
        loading: (
          <TbLoader2 className="size-4 animate-spin text-muted-foreground" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
