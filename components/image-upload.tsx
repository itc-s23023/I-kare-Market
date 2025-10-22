"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X } from "lucide-react"

interface ImageUploadProps {
  onImagesChange: (files: File[]) => void
  maxImages?: number
}

export function ImageUpload({ onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newFiles = Array.from(files).slice(0, maxImages - images.length)
    const updatedImages = [...images, ...newFiles]
    

    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
    const updatedPreviews = [...previews, ...newPreviews]

    setImages(updatedImages)
    setPreviews(updatedPreviews)
    onImagesChange(updatedImages)


    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
 
    URL.revokeObjectURL(previews[index])
    
    const updatedImages = images.filter((_, i) => i !== index)
    const updatedPreviews = previews.filter((_, i) => i !== index)
    
    setImages(updatedImages)
    setPreviews(updatedPreviews)
    onImagesChange(updatedImages)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>商品画像</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={preview}
                alt={`商品画像 ${index + 1}`}
                className="object-cover w-full h-full"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={handleUploadClick}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-2 transition-colors"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">画像を追加</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-sm text-muted-foreground">
          最大{maxImages}枚まで画像をアップロードできます ({images.length}/{maxImages})
        </p>
      </CardContent>
    </Card>
  )
}