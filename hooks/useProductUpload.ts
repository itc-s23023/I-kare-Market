"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { collection, addDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/components/firebaseConfig"
import { v4 as uuidv4 } from "uuid"

export function useProductUpload() {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const uploadImages = async (files: File[]) => {
    console.log("🔄 画像アップロード開始:", files.length, "枚")
    console.log("🔑 現在のユーザー:", user?.uid)
    console.log("🗄️ Storage設定:", storage.app.options)
    
    // ファイルサイズと形式をチェック
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`📁 ファイル${i + 1}: ${file.name}, サイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB, タイプ: ${file.type}`)
 
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`ファイル ${file.name} のサイズが大きすぎます（最大10MB）`)
      }
      
      // 画像形式チェック
      if (!file.type.startsWith('image/')) {
        throw new Error(`ファイル ${file.name} は画像ファイルではありません`)
      }
    }
    
    const uploadPromises = files.map(async (file, index) => {
      try {
        console.log(`⬆️ 画像${index + 1}をアップロード中:`, file.name)
        
        // シンプルなファイル名を生成
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 15)
        const fileExtension = file.name.split('.').pop() || 'jpg'
        const fileName = `${timestamp}_${randomId}.${fileExtension}`
        const fileRef = ref(storage, `products/${fileName}`)
        
        console.log(`📍 アップロード先パス: products/${fileName}`)
        console.log(`🔗 Storage参照:`, fileRef.toString())
        
        // メタデータを追加
        const metadata = {
          contentType: file.type,
          customMetadata: {
            'uploadedBy': user?.uid || 'anonymous',
            'originalName': file.name
          }
        }
        
        console.log(`📤 uploadBytes実行中...`)
        const snapshot = await uploadBytes(fileRef, file, metadata)
        console.log(`✅ 画像${index + 1}アップロード完了:`, snapshot.metadata.fullPath)
        
        console.log(`🔗 ダウンロードURL取得中...`)
        const downloadURL = await getDownloadURL(snapshot.ref)
        console.log(`✅ 画像${index + 1}のURL取得完了:`, downloadURL)
        
        return downloadURL
      } catch (error: any) {
        console.error(`❌ 画像${index + 1}のアップロードエラー:`, error)
        console.error(`エラーコード:`, error?.code)
        console.error(`エラーメッセージ:`, error?.message)
        
        // Firebase Storageエラーの処理
        if (error?.code) {
          switch (error.code) {
            case 'storage/unauthorized':
              throw new Error('🚫 Firebase Storageへのアクセスが拒否されました。ログインまたはStorage権限を確認してください。')
            case 'storage/canceled':
              throw new Error('⏹️ アップロードがキャンセルされました。')
            case 'storage/unknown':
              throw new Error('❓ 不明なStorageエラーが発生しました。Firebase設定を確認してください。')
            case 'storage/object-not-found':
              throw new Error('📂 指定されたStorageパスが見つかりません。')
            case 'storage/bucket-not-found':
              throw new Error('🪣 Storageバケットが見つかりません。Firebase設定を確認してください。')
            case 'storage/project-not-found':
              throw new Error('🏗️ Firebaseプロジェクトが見つかりません。')
            case 'storage/quota-exceeded':
              throw new Error('💾 Storageの容量制限を超えました。')
            case 'storage/unauthenticated':
              throw new Error('🔐 認証が必要です。ログインしてください。')
            case 'storage/retry-limit-exceeded':
              throw new Error('🔄 リトライ制限を超えました。しばらく待ってから再試行してください。')
            default:
              throw new Error(`🚨 Storage エラー [${error.code}]: ${error.message || 'Unknown error'}`)
          }
        } else {
          throw new Error(`🚨 画像のアップロードに失敗しました: ${error?.message || error}`)
        }
      }
    })
    
    const results = await Promise.all(uploadPromises)
    console.log(`🎉 全画像アップロード完了:`, results)
    return results
  }

  const submitProduct = async (productData: {
    productname: string
    content: string
    price: number
    is_trading: boolean
    images: File[]
  }) => {
    console.log("商品出品開始:", productData)
    
    if (!user) {
      throw new Error("ログインが必要です")
    }

    if (!productData.productname || !productData.content || !productData.price) {
      throw new Error("必須項目を入力してください")
    }

    setIsSubmitting(true)

    try {
      let imageUrls: string[] = []
      
      // 画像がある場合のみアップロード
      if (productData.images.length > 0) {
        try {
          console.log("画像アップロード処理開始")
          imageUrls = await uploadImages(productData.images)
          console.log("全画像アップロード完了:", imageUrls)
        } catch (uploadError: any) {
          console.warn("画像アップロードに失敗しましたが、商品出品は続行します:", uploadError)
          // 画像アップロードが失敗しても商品出品は継続
        }
      } else {
        console.log("画像なしで出品")
      }

      console.log("Firestoreに商品データ保存開始")
      // Firestoreに商品データを保存
      const docData = {
  productname: productData.productname,
  image_url: imageUrls[0] || "/placeholder.jpg",
  image_urls: imageUrls,
  price: Number(productData.price),
  userid: user.uid,
  content: productData.content,
  is_trading: productData.is_trading,
  createdAt: new Date().toISOString(),
  status: "active",
  sellerName: user.displayName || "匿名ユーザー",
  sellerEmail: user.email,
  sellerImage: user.photoURL || "/placeholder-user.jpg"
      }
      
      console.log("保存するデータ:", docData)
      const docRef = await addDoc(collection(db, "products"), docData)
      console.log("Firestore保存完了:", docRef.id)

      const message = imageUrls.length > 0 ? 
        "商品を出品しました！" : 
        "商品を出品しました！（画像アップロードはスキップされました）"

      return { success: true, message }
    } catch (error: any) {
      console.error("出品エラー詳細:", error)
      if (error instanceof Error) {
        throw new Error(`出品に失敗しました: ${error.message}`)
      } else {
        throw new Error("出品に失敗しました: 不明なエラー")
      }
    } finally {
      console.log("出品処理終了")
      setIsSubmitting(false)
    }
  }

  return {
    submitProduct,
    isSubmitting,
    user
  }
}