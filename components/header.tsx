"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, User, Menu, Gavel } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            学
          </div>
          <span className="font-bold text-lg hidden sm:inline-block">学内マーケット</span>
        </Link>

        <div className="flex-1 max-w-xl mx-auto hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="商品を検索..." className="pl-10" />
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/auctions">
              <Gavel className="h-4 w-4 mr-2" />
              オークション
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/sell">
              <Plus className="h-4 w-4 mr-2" />
              出品する
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/profile">
              <User className="h-4 w-4 mr-2" />
              マイページ
            </Link>
          </Button>
        </nav>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-4 mt-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="商品を検索..." className="pl-10" />
              </div>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/auctions">
                  <Gavel className="h-4 w-4 mr-2" />
                  オークション
                </Link>
              </Button>
              <Button asChild className="w-full justify-start">
                <Link href="/sell">
                  <Plus className="h-4 w-4 mr-2" />
                  出品する
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
