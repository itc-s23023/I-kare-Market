"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Bell, Plus, User, Menu, Gavel, ShoppingBag, LogIn, LogOut, Phone } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useNotifications } from "@/hooks/useNotifications"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebaseConfig"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { notifications, unreadCount, markAsRead } = useNotifications()

  const isAuctionPage = pathname?.startsWith("/auctions")

  const handleNotificationClick = async (notificationId: string, auctionId?: string, productId?: string, type?: string) => {
    // 対象通知の詳細を取得(追加メタ情報で分岐を強化)
    const n = notifications.find((x) => x.id === notificationId)

    // 通知を既読にする
    await markAsRead(notificationId)

    // チャット系の通知はチャット画面へ
    if (n?.type === "chat_message") {
      if (n.auctionId) return router.push(`/chat/${n.auctionId}?type=auction`)
      if (n.productId) return router.push(`/chat/${n.productId}?type=product`)
    }

    // 取引同意の通知はチャット画面へ
    if (n?.type === "transaction_agreed") {
      if (n.auctionId) return router.push(`/chat/${n.auctionId}?type=auction`)
      if (n.productId) return router.push(`/chat/${n.productId}?type=product`)
    }

    // オークション終了で最高入札者が決まった/取引開始 → チャットへ
    if ((n?.type === "auction_won" || n?.type === "transaction_started") && n?.auctionId) {
      return router.push(`/chat/${n.auctionId}?type=auction`)
    }

    // "オークション終了" でも落札者がいる場合（buyerIdがある）→ チャットへ
    if (n?.type === "auction_ended" && n?.auctionId && n?.buyerId) {
      return router.push(`/chat/${n.auctionId}?type=auction`)
    }

    // 通常のフォールバック（詳細ページへ）
    if (auctionId) return router.push(`/auctions/${auctionId}`)
    if (productId) {
      // productの通知でチャット遷移したいケース（itemTypeがproduct）
      if (n?.itemType === "product") {
        return router.push(`/chat/${productId}?type=product`)
      }
      return router.push(`/products/${productId}`)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("ログアウトエラー:", error)
    }
  }

  const sellLink = isAuctionPage ? "/auctions/sell" : "/sell"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative h-10 w-auto">
            <Image
              src="/college-logo.png"
              alt="フジ学園専門学校 ITカレッジ沖縄"
              width={35}
              height={35}
              className="object-contain"
            />
          </div>
          <span className="font-bold text-2xl hidden lg:inline-block bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            アイカレマーケット
          </span>
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
          
          {user && (
            <Button asChild variant="ghost">
              <Link href={sellLink}>
                <Plus className="h-4 w-4 mr-2" />
                出品する
              </Link>
            </Button>
          )}

          {user && (
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
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="px-2 py-1.5 text-sm font-semibold">通知</div>
                {notifications.length === 0 ? (
                  <div className="px-2 py-8 text-center text-sm text-muted-foreground">通知はありません</div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                      onClick={() => handleNotificationClick(notification.id, notification.auctionId, notification.productId, notification.type)}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm leading-relaxed mt-1 ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.createdAt).toLocaleString("ja-JP")}
                          </p>
                        </div>
                        {!notification.read && <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" />}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block">{user.displayName || "ユーザー"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-2" />
                    マイページ
                  </Link>
                </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/contact">
                      <Phone className="h-4 w-4 mr-2" />
                      お問い合わせ
                    </Link>
                  </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !loading && (
              <Button asChild>
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  ログイン
                </Link>
              </Button>
            )
          )}
        </nav>

        {/* スマホ表示用：通知アイコンの左に出品ボタン（プラスアイコン）を追加 */}
        <div className="md:hidden ml-auto flex items-center gap-2">
          {user && (
            <>
              {/* プラスアイコン（出品） */}
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="出品する"
              >
                <Link href={sellLink}>
                  <Plus className="h-6 w-6" />
                </Link>
              </Button>
              {/* 通知アイコン */}
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
                <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                  <div className="px-2 py-1.5 text-sm font-semibold">通知</div>
                  {notifications.length === 0 ? (
                    <div className="px-2 py-8 text-center text-sm text-muted-foreground">通知はありません</div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                        onClick={() => handleNotificationClick(notification.id, notification.auctionId, notification.productId, notification.type)}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm leading-relaxed mt-1 ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.createdAt).toLocaleString("ja-JP")}
                            </p>
                          </div>
                          {!notification.read && <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" />}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-4 mt-8">
              {user && (
                <div className="flex items-center gap-2 pb-4 border-b">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.displayName || "ユーザー"}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              )}

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

              {user ? (
                <>
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link href="/profile">
                      <User className="h-4 w-4 mr-2" />
                      マイページ
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link href="/contact">
                      <Phone className="h-4 w-4 mr-2" />
                      お問い合わせ
                    </Link>
                  </Button>
                  <Button 
                    onClick={handleSignOut}
                    variant="ghost" 
                    className="w-full justify-start text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    ログアウト
                  </Button>
                </>
              ) : (
                !loading && (
                  <Button asChild className="w-full justify-start">
                    <Link href="/login">
                      <LogIn className="h-4 w-4 mr-2" />
                      ログイン
                    </Link>
                  </Button>
                )
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
