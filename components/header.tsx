"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell, Plus, User, Menu, Gavel, ShoppingBag } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { mockNotifications } from "@/lib/mock-data"
import { useRouter, usePathname } from "next/navigation"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const unreadCount = mockNotifications.filter((n) => !n.read).length

  const isAuctionPage = pathname?.startsWith("/auctions")

  const handleNotificationClick = (productId: string, type: string) => {
    if (type === "auction" || productId.startsWith("a")) {
      router.push(`/auctions/${productId}`)
    } else {
      router.push(`/products/${productId}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            学
          </div>
          <span className="font-bold text-lg hidden sm:inline-block">学内マーケット</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 ml-auto">
          {isAuctionPage ? (
            <Button asChild variant="ghost">
              <Link href="/">
                <ShoppingBag className="h-4 w-4 mr-2" />
                フリマ
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/auctions">
                <Gavel className="h-4 w-4 mr-2" />
                オークション
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link href="/sell">
              <Plus className="h-4 w-4 mr-2" />
              出品する
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-2 py-1.5 text-sm font-semibold">通知</div>
              {mockNotifications.length === 0 ? (
                <div className="px-2 py-8 text-center text-sm text-muted-foreground">通知はありません</div>
              ) : (
                mockNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    onClick={() => handleNotificationClick(notification.productId, notification.type)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <div className="flex-1">
                        <p className={`text-sm leading-relaxed ${!notification.read ? "font-semibold" : ""}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.timestamp).toLocaleString("ja-JP")}
                        </p>
                      </div>
                      {!notification.read && <div className="h-2 w-2 rounded-full bg-primary mt-1" />}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild variant="ghost">
            <Link href="/profile">
              <User className="h-4 w-4 mr-2" />
              マイページ
            </Link>
          </Button>
        </nav>

        <Sheet>
          <SheetTrigger asChild className="md:hidden ml-auto">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-4 mt-8">
              {isAuctionPage ? (
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    フリマ
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/auctions">
                    <Gavel className="h-4 w-4 mr-2" />
                    オークション
                  </Link>
                </Button>
              )}
              <Button asChild className="w-full justify-start">
                <Link href="/sell">
                  <Plus className="h-4 w-4 mr-2" />
                  出品する
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start relative">
                <Link href="/profile">
                  <Bell className="h-4 w-4 mr-2" />
                  通知
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/profile">
                  <User className="h-4 w-4 mr-2" />
                  マイページ
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
