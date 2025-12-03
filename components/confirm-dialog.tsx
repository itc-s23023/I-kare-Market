"use client"

import React from "react"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export interface ConfirmDialogProps {
  trigger: React.ReactElement // asChild で包むトリガー (Button 等)
  title: React.ReactNode
  description?: React.ReactNode
  onConfirm: () => void | Promise<void>
  confirmLabel?: string
  cancelLabel?: string
  confirmDisabled?: boolean
  loading?: boolean
  // ボタンバリアント (shadcn Button の variant 型を簡易に文字列で指定)
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  cancelVariant?: "outline" | "secondary" | "ghost" | "link"
  // 確定時自動的に閉じたい (Radix の Action ボタンはデフォルトで閉じる)
  // 追加の副作用が必要なら親側で loading/state を管理し、Dialog 再度開閉制御する
}

/**
 * ConfirmDialog: 繰り返し出てきた確認モーダルを共通化
 * 使用例:
 * <ConfirmDialog
 *   trigger={<Button>削除</Button>}
 *   title="削除しますか?"
 *   description="この操作は取り消せません"
 *   confirmLabel="削除を確定"
 *   confirmVariant="destructive"
 *   onConfirm={handleDelete}
 * />
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
  confirmLabel = "確定",
  cancelLabel = "キャンセル",
  confirmDisabled,
  loading,
  confirmVariant = "default",
  cancelVariant = "outline",
}: ConfirmDialogProps) {
  // trigger の disabled が明示されているならそのまま活かしたいので clone しない
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant={cancelVariant}>
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={onConfirm}
              disabled={confirmDisabled || loading}
              variant={confirmVariant}
            >
              {loading ? "処理中..." : confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDialog
