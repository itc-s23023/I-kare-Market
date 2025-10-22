"use client"

import { useState } from "react"
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth"
import { auth, googleProvider } from "@/components/firebaseConfig"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect } from "react"
import Image from "next/image"

export default function LoginPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      console.log("ログイン成功:", result.user)
    } catch (error) {
      console.error("ログインエラー:", error)
      const errorMessage = error instanceof Error ? error.message : "不明なエラーが発生しました"
      alert("ログインに失敗しました: " + errorMessage)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      console.log("ログアウト成功")
    } catch (error) {
      console.error("ログアウトエラー:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">I-kare Market</CardTitle>
          <CardDescription>
            {user ? "アカウント情報" : "Googleアカウントでログイン"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <Image
                  src={user.photoURL || "/placeholder-user.jpg"}
                  alt="プロフィール画像"
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium">{user.displayName}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = "/"}
                >
                  マーケットプレイスへ
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleSignOut}
                >
                  ログアウト
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Googleでログイン
              </Button>
              <div className="text-center text-sm text-gray-600">
                安全にログインして、I-kare Marketをお楽しみください
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}