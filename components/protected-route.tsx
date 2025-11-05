"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

/**
 * 認証が必要なページを保護するコンポーネント
 * 未ログインの場合はログインページにリダイレクトします
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 認証状態の確認が完了し、ユーザーがログインしていない場合
    if (!loading && !user) {
      console.log("未ログイン: ログインページにリダイレクトします")
      router.push("/login")
    }
  }, [user, loading, router])

  // ローディング中は読み込み画面を表示
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

  // ユーザーがログインしていない場合は何も表示しない（リダイレクト処理中）
  if (!user) {
    return null
  }

  // ログイン済みの場合は子コンポーネントを表示
  return <>{children}</>
}
