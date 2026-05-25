"use client"

import { useEffect } from "react"
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"
import { toast, Toaster } from "sonner"

declare global {
  interface Window {
    __zyntexAlertPatched?: boolean
    __zyntexNativeAlert?: typeof window.alert
  }
}

const formatAlertMessage = (message?: unknown) => {
  if (message === undefined || message === null) {
    return ""
  }

  return String(message)
}

export function AppAlerts() {
  useEffect(() => {
    if (typeof window === "undefined" || window.__zyntexAlertPatched) {
      return
    }

    window.__zyntexNativeAlert = window.alert.bind(window)
    window.alert = (message?: unknown) => {
      const description = formatAlertMessage(message)

      toast.warning("Atenção", {
        description,
        duration: 5200,
      })
    }
    window.__zyntexAlertPatched = true
  }, [])

  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      icons={{
        error: <XCircle className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        success: <CheckCircle2 className="h-4 w-4" />,
        warning: <AlertTriangle className="h-4 w-4" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "font-montserrat rounded-2xl border border-[#e8e4d8] bg-white shadow-[0_14px_40px_rgba(26,40,31,0.12)]",
          title: "text-sm font-bold text-[#25352C]",
          description: "text-sm leading-5 text-[#6c756b]",
          warning: "border-[#efd99c] bg-[#fffbf0]",
          error: "border-[#ead5d0] bg-[#fff8f6]",
          success: "border-[#d7ead8] bg-[#fbfefb]",
          info: "border-[#d8e0d8] bg-[#fbfcfb]",
          closeButton:
            "border-[#e8e4d8] bg-white text-[#6c756b] hover:bg-[#f7f6f0] hover:text-[#25352C]",
        },
      }}
    />
  )
}
