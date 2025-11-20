"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Toast } from "@/components/ui/toast"
import { useNotifications } from "@/hooks/useNotifications"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function  NotificationToasts() {
  const { toasts, removeToast, notifications } = useNotifications()
  const router = useRouter()

  const handleToastClick = (toastId: string) => {
    const notification = notifications.find(n => n.id === toastId)
    if (!notification) return

    // チャットメッセージ通知の処理
    if (notification.type === "chat_message") {
      if (notification.auctionId) {
        router.push(`/chat/${notification.auctionId}?type=auction`)
        removeToast(toastId)
      } else if (notification.productId) {
        router.push(`/chat/${notification.productId}?type=product`)
        removeToast(toastId)
      }
      return
    }

    // オークション落札・終了の通知からチャットへ遷移
    if ((notification.type === "auction_won" || notification.type === "auction_ended" || notification.type === "transaction_started") && notification.auctionId) {
      router.push(`/chat/${notification.auctionId}?type=auction`)
      removeToast(toastId)
    }
    // 商品関連の通知からチャットへ遷移
    else if (notification.productId && notification.itemType === "product") {
      router.push(`/chat/${notification.productId}?type=product`)
      removeToast(toastId)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleToastClick(toast.id)}
          className="cursor-pointer"
        >
          <Toast
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            action={
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  removeToast(toast.id)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      ))}
    </div>
  )
}