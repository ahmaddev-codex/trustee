"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  TbCircleCheckFilled,
  TbInfoCircleFilled,
  TbAlertTriangleFilled,
  TbOctagonFilled,
  TbLoader2,
} from "react-icons/tb"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      gap={20}
      className="toaster group"
      icons={{
        success: (
          <TbCircleCheckFilled className="size-4 text-green-600 dark:text-green-400" />
        ),
        info: (
          <TbInfoCircleFilled className="size-4 text-cyan-600 dark:text-cyan" />
        ),
        warning: (
          <TbAlertTriangleFilled className="size-4 text-amber-500" />
        ),
        error: (
          <TbOctagonFilled className="size-4 text-destructive" />
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
          "--border-radius": "0px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          success: "border-l-4 border-l-green-600 dark:border-l-green-400",
          info: "border-l-4 border-l-cyan-600",
          warning: "border-l-4 border-l-amber-500",
          error: "border-l-4 border-l-destructive",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
