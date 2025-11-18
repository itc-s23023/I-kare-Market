"use client"

import React from "react"
import { Toast } from "@/components/ui/toast"
import { useNotifications } from "@/hooks/useNotifications"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function  NotificationToasts() {
  const { toasts, removeToast } = useNotifications()

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          action={
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => removeToast(toast.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          }
        />
      ))}
    </div>
  )
}