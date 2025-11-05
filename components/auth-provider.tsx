"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebaseConfig"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  
  const createOrUpdateUserProfile = async (user: User) => {
    try {
      const userDocRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userDocRef)

     
      if (!userDoc.exists()) {
        console.log("🔄 新規ユーザー登録:", user.uid)
        
        await setDoc(userDocRef, {
          uid: user.uid,
          username: user.displayName || "匿名ユーザー",
          email: user.email,
          avatar: user.photoURL || "",
          evalution:[],
          Sales:0,
          likeproductId: []
        })
        
        console.log("✅ ユーザープロフィール作成完了")
      } else {
        
        await setDoc(userDocRef, {
          updatedAt: new Date().toISOString(),
          username: user.displayName || userDoc.data()?.username || "匿名ユーザー",
          avatar: user.photoURL || userDoc.data()?.avatar || ""
        }, { merge: true })
        
        console.log("✅ ユーザープロフィール更新完了")
      }
    } catch (error) {
      console.error("❌ ユーザープロフィール作成/更新エラー:", error)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // ユーザーがログインしている場合、Firestoreにプロフィールを作成/更新
        await createOrUpdateUserProfile(currentUser)
      }
      
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}