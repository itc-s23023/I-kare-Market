import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id?: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
  className?: string
}

export function Toast({ 
  title, 
  description, 
  action, 
  variant = "default", 
  className,
  ...props 
}: ToastProps) {
  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
        variant === "default" && "border bg-background text-foreground",
        variant === "destructive" && "destructive border-destructive bg-destructive text-destructive-foreground",
        className
      )}
      {...props}
    >
      <div className="grid gap-1">
        {title && (
          <div className="text-sm font-semibold">{title}</div>
        )}
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
      {action}
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <div className="fixed bottom-0 right-0 z-50 w-full max-w-md p-4 space-y-4 pointer-events-none" />
    </div>
  )
}