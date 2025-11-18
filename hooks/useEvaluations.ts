"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { useAuth } from "@/components/auth-provider"

export interface Evaluation {
  id: string
  user: string
  userimageURL: string
  content: string
  score: number
  createdAt?: string
}

export function useEvaluations() {
  const { user } = useAuth()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchEvaluations = async () => {
      try {
        console.log("🔄 評価一覧取得開始:", user.uid)
        
        // users/{userId}/evaluations コレクションから評価を取得
        const evaluationsRef = collection(db, "users", user.uid, "evaluations")
        
        // まず、orderByなしでクエリを実行してデータの存在を確認
        console.log("📊 基本クエリで評価データを確認中...")
        const basicQuery = await getDocs(evaluationsRef)
        console.log(`📄 基本クエリ結果: ${basicQuery.size}件のドキュメントが見つかりました`)
        
        // 各ドキュメントの詳細をログ出力
        basicQuery.forEach((doc, index) => {
          const data = doc.data()
          console.log(`📝 評価${index + 1}:`, {
            id: doc.id,
            data: data,
            createdAt: data.createdAt,
            createdAtType: typeof data.createdAt
          })
        })
        
        const evaluationsData: Evaluation[] = []
        
        basicQuery.forEach((doc) => {
          const data = doc.data()
          const evaluation = {
            id: doc.id,
            user: data.user || "匿名ユーザー",
            userimageURL: data.userimageURL || "/placeholder-user.jpg",
            content: data.content || "",
            score: Number(data.score) || 0,
            createdAt: data.createdAt || new Date().toISOString()
          }
          console.log("✅ 評価データを配列に追加:", evaluation)
          evaluationsData.push(evaluation)
        })

        console.log(`✅ 評価一覧取得完了: ${evaluationsData.length}件`)
        setEvaluations(evaluationsData)
        setError(null)
      } catch (error: any) {
        console.error("❌ 評価一覧取得エラー:", error)
        setError(`評価の取得に失敗しました: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchEvaluations()
  }, [user])

  return { evaluations, loading, error }
}