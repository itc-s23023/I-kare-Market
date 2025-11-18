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

        // クライアント側で最新順にソート
        evaluationsData.sort((a, b) => {
          const dateA = new Date(a.createdAt || "")
          const dateB = new Date(b.createdAt || "")
          return dateB.getTime() - dateA.getTime() // 最新順（降順）
        })

        console.log(`✅ 評価一覧取得完了: ${evaluationsData.length}件（最新順にソート済み）`)
        console.log("📋 ソート後の評価配列:", evaluationsData)

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