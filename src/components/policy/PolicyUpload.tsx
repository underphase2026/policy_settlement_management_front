import React, { useState, useRef } from "react"
import { UploadCloud, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DynamicTable } from "./dynamic-table"

interface PolicyUploadProps {
  className?: string
}

export function PolicyUpload({ className }: PolicyUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [priceResult, setPriceResult] = useState<any[] | null>(null)
  const [additionalResult, setAdditionalResult] = useState<any[] | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = async (filesToProcess: File[]) => {
    const validFiles = filesToProcess.filter(f => f.type.startsWith("image/"))
    if (validFiles.length === 0) {
      setError("지원하지 않는 형식입니다. 이미지 파일만 업로드해 주세요.")
      return
    }

    setIsLoading(true)
    setError(null)
    setPriceResult(null)
    setAdditionalResult(null)

    try {
      const formData = new FormData()
      validFiles.forEach(file => formData.append("files", file))

      const baseUrl = "http://localhost:3000/api/v1/policy"

      const validateResponse = async (res: Response, name: string) => {
        if (!res.ok) {
          let errMessage = `${res.status}`
          try {
            const errJson = await res.json()
            if (errJson.error && errJson.error.message) {
              errMessage += ` - ${errJson.error.message}`
            } else {
              errMessage += ` - ${JSON.stringify(errJson)}`
            }
          } catch {
            errMessage += ` - ${await res.text()}`
          }
          throw new Error(`[${name}] API 호출 실패: ${errMessage}`)
        }
        return res.json()
      }

      // 1. 단일(통합) API 호춣 - 단가표 및 부가서비스를 한번에 가져옴
      const extractAllRes = await fetch(`${baseUrl}/extract-all`, {
        method: "POST",
        body: formData,
      })
      const extractedData = await validateResponse(extractAllRes, "정책 통합 분석")
      
      if (extractedData.data) {
        setPriceResult(extractedData.data.priceTable || [])
        setAdditionalResult(extractedData.data.additionalServices || [])
      }

    } catch (err: any) {
      console.error(err)
      setError(err.message || "서버와 통신 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files))
    }
    e.target.value = ""
  }

  return (
    <div className={cn("space-y-6 w-full max-w-4xl", className)}>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
          isLoading && "pointer-events-none opacity-50"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium">단가표 및 부가서비스를 서버에서 분석 중입니다...</p>
              <p className="text-xs">약 5~15초 정도가 소요될 수 있습니다.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="rounded-full bg-accent p-4">
              <UploadCloud className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">정책표 이미지를 드래그하거나 클릭하여 업로드</p>
              <p className="text-xs">JPG, PNG 등 이미지 형식 지원</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-4 text-sm text-destructive font-medium border border-destructive/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {priceResult && priceResult.length > 0 && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="font-semibold text-foreground">단가표 데이터 추출 완료</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            서버를 통해 단가표 부분에 대해 분석된 정책 데이터입니다.
          </p>
          <div className="relative overflow-hidden rounded-lg bg-[#282a36] p-5 mb-4">
            <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#f8f8f2] max-h-60">
              <code>{JSON.stringify(priceResult, null, 2)}</code>
            </pre>
          </div>
          <DynamicTable data={priceResult} />
        </div>
      )}

      {additionalResult && (Array.isArray(additionalResult) ? additionalResult.length > 0 : Object.keys(additionalResult).length > 0) && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm mt-6">
          <div className="flex items-center gap-2 text-blue-600">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="font-semibold text-foreground">부가서비스 및 제재규정 추출 완료</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            서버를 통해 부가서비스 및 패널티 내용에 대해 분석된 데이터입니다.
          </p>
          <div className="relative overflow-hidden rounded-lg bg-[#282a36] p-5 mb-4">
            <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#f8f8f2] max-h-60">
              <code>{JSON.stringify(additionalResult, null, 2)}</code>
            </pre>
          </div>
          <DynamicTable data={additionalResult} />
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border/50 text-[10px] text-muted-foreground/60">
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-emerald-500" />
          <span>Backend Server Connected</span>
        </div>
      </div>
    </div>
  )
}

export default PolicyUpload

