"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, LoaderCircle, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateUserPhoto } from "@/lib/actions/user-data"
import { IUserData, IUserDataWithBankAccounts } from "@/types/user-data"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import imageCompression from 'browser-image-compression';

interface ProfilePhotoUploadProps {

  className?: string
}

export function ProfilePhotoUpload({ className }: ProfilePhotoUploadProps) {
  const { userData, setUserData } = useAuth();

  if (!userData) {
    return <div>Loading...</div>
  }

  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutate: handlePhotoChange, isPending: isUploadingPhoto } = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 1 * 1024 * 1024) { // 1MB

        file = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 500,
          useWebWorker: true
        });

      }

      const photoURL = await updateUserPhoto(file);

      setUserData((prev) => ({ ...prev, photoURL }) as IUserDataWithBankAccounts)
    },
    onError: (error: any) => {
      toast.error("Lỗi", {
        description: "Đã có lỗi xảy ra khi tải ảnh lên"
      })
    },
    onSuccess: () => {
      toast.success("Thành công", {
        description: "Ảnh đại diện đã được cập nhật"
      })
    }
  })

  const handleFileSelect = async (file: File) => {
    if (file && file.type.startsWith("image/")) {
      handlePhotoChange(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div
        className={cn("relative group cursor-pointer transition-all duration-200", isDragOver && "scale-105", isUploadingPhoto && "opacity-50 pointer-events-none")}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <Avatar className="w-24 h-24 border-4 border-border group-hover:border-primary transition-colors">
          {isUploadingPhoto && <LoaderCircle className="absolute inset-0 m-auto w-6 h-6 text-primary animate-spin" />}
          <AvatarImage src={userData.photoURL || "/placeholder.svg"} alt={userData.displayName} />
          <AvatarFallback className="text-2xl font-semibold bg-secondary">
            {userData.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </div>
        {isDragOver && (
          <div className="absolute inset-0 bg-primary/20 rounded-full border-2 border-dashed border-primary flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
        )}
      </div>

      <Button disabled={isUploadingPhoto} variant="outline" size="sm" onClick={handleClick}>
        <Upload className="w-4 h-4 mr-2" />
        Tải ảnh lên
      </Button>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />

      <p className="text-xs text-muted-foreground text-center">Kéo thả ảnh vào đây hoặc nhấp để chọn file</p>
    </div>
  )
}
