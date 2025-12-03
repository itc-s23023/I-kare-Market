"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, TrendingUp, User, Heart } from "lucide-react"
import Image from "next/image"
import { useLikes } from "@/hooks/uselike"
import type { Auction } from "@/hooks/useAuctions"

interface AuctionCardProps {
  auction: Auction
}

function getTimeRemaining(endTime: string) {
  const now = new Date()
  const end = new Date(endTime)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return "終了"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `残り${days}日`
  if (hours > 0) return `残り${hours}時間`
  return `残り${minutes}分`
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const { isAuctionLiked, toggleAuctionLike } = useLikes()
  const timeRemaining = getTimeRemaining(auction.endTime)
  const isEnding = timeRemaining.includes("時間") || timeRemaining.includes("分")
  const hasNoBids = auction.bidCount === 0

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (auction.id) {
      toggleAuctionLike(auction.id)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="aspect-[4/3] sm:aspect-square relative overflow-hidden bg-muted">
        <Image 
          src={auction.images[0] || "/placeholder.svg"} 
          alt={auction.title} 
          fill 
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.svg";
          }}
        />
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-3 right-3 h-9 w-9 rounded-full shadow-md"
          onClick={handleLikeClick}
        >
          <Heart className={`h-5 w-5 ${auction.id && isAuctionLiked(auction.id) ? "fill-red-500 text-red-500" : ""}`} />
        </Button>
        {auction.status === "ended" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-lg">
              終了
            </Badge>
          </div>
        )}
        {auction.status === "active" && auction.bidCount > 0 && (
          <Badge className="absolute top-3 left-3 bg-primary">入札中</Badge>
        )}
      </div>
      <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-balance leading-tight mb-2 line-clamp-2">{auction.title}</h3>

        {/* オークション説明 - スマホでは非表示 */}
        {auction.description && (
          <p className="hidden sm:block text-sm text-muted-foreground mb-2 line-clamp-2">
            {auction.description}
          </p>
        )}

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{hasNoBids ? "開始価格" : "現在の入札額"}</span>
            <span className="text-xl font-bold text-primary">¥{auction.currentBid.toLocaleString()}</span>
          </div>
          {auction.buyNowPrice && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">即決価格</span>
              <span className="text-sm font-semibold">¥{auction.buyNowPrice.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{hasNoBids ? "入札なし" : `${auction.bidCount}件`}</span>
          </div>
          <div className="flex items-center gap-1 truncate">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{auction.sellerName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={`text-sm font-medium ${isEnding ? "text-destructive" : "text-muted-foreground"}`}>
            {timeRemaining}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
