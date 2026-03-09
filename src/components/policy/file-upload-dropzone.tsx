import { useCallback, useState, useRef } from "react"
import { Upload, FileImage, FileSpreadsheet, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface UploadedFile {
  id: string
  name: string
  type: "image" | "excel"
  size: number
  preview?: string
  file: File // API 분석을 위한 원본 파일 객체
}

interface FileUploadDropzoneProps {
  files: UploadedFile[]
  onFilesAdded: (files: UploadedFile[]) => void
  onFileRemove: (id: string) => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / 1048576).toFixed(1) + " MB"
}

export function FileUploadDropzone({
  files,
  onFilesAdded,
  onFileRemove,
}: FileUploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadedFile[] = []
      Array.from(fileList).forEach((file) => {
        const isImage = file.type.startsWith("image/")
        const isExcel =
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".csv") ||
          file.type.includes("spreadsheet")
        if (isImage || isExcel) {
          newFiles.push({
            id: crypto.randomUUID(),
            name: file.name,
            type: isImage ? "image" : "excel",
            size: file.size,
            preview: isImage ? URL.createObjectURL(file) : undefined,
            file,
          })
        }
      })
      if (newFiles.length > 0) onFilesAdded(newFiles)
    },
    [onFilesAdded]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="size-5 text-primary" />
          파일 업로드
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          )}
          role="button"
          tabIndex={0}
          aria-label="파일을 드래그하거나 클릭하여 업로드"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="size-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              정책표 파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              이미지(.jpg, .png) 또는 엑셀(.xlsx, .csv) 파일 지원
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.xlsx,.csv"
            multiple
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files)
              e.target.value = ""
            }}
          />
        </div>

        {/* Uploaded files list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              업로드된 파일 ({files.length})
            </p>
            <div className="grid gap-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-accent/30 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    {file.type === "image" ? (
                      <FileImage className="size-4 text-primary" />
                    ) : (
                      <FileSpreadsheet className="size-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-xs"
                  >
                    {file.type === "image" ? "이미지" : "엑셀"}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onFileRemove(file.id)
                    }}
                    className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`${file.name} 제거`}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
