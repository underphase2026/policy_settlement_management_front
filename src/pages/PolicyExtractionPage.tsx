import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, Share2, Trash2, Copy, Check } from "lucide-react"

import { FileUploadDropzone, type UploadedFile } from "@/components/policy/file-upload-dropzone"
import { AnalysisProcess } from "@/components/policy/analysis-process"
import { DynamicTable } from "@/components/policy/dynamic-table"
import { cn } from "@/lib/utils"

export default function PolicyExtractionPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "analyzing" | "complete" | "error">("idle")
  const [priceData, setPriceData] = useState<Record<string, unknown>[]>([])
  const [additionalData, setAdditionalData] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyJson = useCallback(async () => {
    const jsonString = JSON.stringify({ priceTable: priceData, additionalServices: additionalData }, null, 2)
    try {
      await navigator.clipboard.writeText(jsonString)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("복사에 실패했습니다.", err)
    }
  }, [priceData, additionalData])

  const handleFilesAdded = useCallback((newFiles: UploadedFile[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    setAnalysisStatus("idle") // Reset analysis on new files
    setError(null)
  }, [])

  const handleFileRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    if (files.length <= 1) {
      setAnalysisStatus("idle")
      setPriceData([])
      setAdditionalData([])
      setError(null)
    }
  }, [files])

  const handleAnalysisStart = useCallback(async () => {
    if (files.length === 0) return

    setError(null)
    try {
      const validFiles = files.map((item) => item.file).filter(Boolean) as File[]
      if (validFiles.length === 0) throw new Error("업로드된 파일 객체를 찾을 수 없습니다.")

      const form = new FormData()
      for (const file of validFiles) {
        form.append("files", file)
      }
      form.append("planTiers", JSON.stringify(["115K", "105K", "95K"]))
      form.append("responseFormat", "json_array")

      const res = await fetch(`/api/v1/policy/extract-all`, {
        method: "POST",
        body: form,
      })

      const json = (await res.json().catch(() => null)) as
        | {
            ok: true
            data: { priceTable: Record<string, unknown>[]; additionalServices: Record<string, unknown>[] }
          }
        | {
            ok: false
            error?: { code?: string; message?: string; details?: unknown }
          }
        | null

      if (!json || json.ok !== true) {
        const msg =
          json && "error" in json && json.error?.message
            ? json.error.message
            : `요청 실패 (${res.status})`
        throw new Error(msg)
      }

      if ((!json.data.priceTable || json.data.priceTable.length === 0) && (!json.data.additionalServices || json.data.additionalServices.length === 0)) {
        throw new Error("분석 결과를 추출할 수 없습니다.")
      }

      setPriceData(json.data.priceTable || [])
      setAdditionalData(json.data.additionalServices || [])
    } catch (err: unknown) {
      console.error(err)
      const message =
        err instanceof Error ? err.message : "분석 중 예기치 못한 오류가 발생했습니다."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    }
  }, [files])


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">정책표 자동 데이터 추출</h1>
          <p className="text-muted-foreground text-sm">
            단가표 이미지(JPEG, PNG, WebP, GIF)를 업로드하면 서버에서 분석해 데이터를 추출합니다.
          </p>
        </div>
        
        {/* Stepper Logic Component */}
        <div className="flex flex-wrap items-center gap-4 py-2 overflow-x-auto no-scrollbar">
          {[
            { step: 1, label: "파일 업로드", active: files.length === 0 || (files.length > 0 && analysisStatus === 'idle') },
            { step: 2, label: "분석", active: analysisStatus === 'analyzing' || analysisStatus === 'complete' },
            { step: 3, label: "검토 및 매핑", active: priceData.length > 0 || additionalData.length > 0 },
            { step: 4, label: "등록", active: false },
          ].map((item, idx) => (
            <div key={item.step} className="flex items-center gap-3 shrink-0">
              <div className={cn(
                "flex h-7 items-center justify-center rounded-full px-3 text-[11px] font-semibold transition-colors",
                item.active 
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30" 
                  : "bg-muted text-muted-foreground border border-border"
              )}>
                <span className="mr-1.5 opacity-70 underline decoration-primary/30 underline-offset-2">{item.step}</span>
                {item.label}
              </div>
              {idx < 3 && (
                <div className="h-[1px] w-8 bg-border hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Upload & Process side-by-side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FileUploadDropzone
          files={files}
          onFilesAdded={handleFilesAdded}
          onFileRemove={handleFileRemove}
        />
        <AnalysisProcess
          hasFiles={files.length > 0}
          status={analysisStatus}
          setStatus={setAnalysisStatus}
          onAnalysisStart={handleAnalysisStart}
          error={error}
        />
      </div>

      {/* Result Section (Raw JSON Output) */}
      {(priceData.length > 0 || additionalData.length > 0) && (
        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">추출 결과 (JSON)</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 font-semibold">
                <Share2 className="mr-2 size-3.5" />
                공유
              </Button>
              <Button size="sm" className="h-8 font-bold">
                <Save className="mr-2 size-3.5" />
                결과 저장
              </Button>
            </div>
          </div>
          
          <Card className="border-primary/20 shadow-lg overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 py-3 px-6 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Extracted Data Output (JSON)
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleCopyJson} title="JSON 복사">
                {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-[#1e1e1e] p-6 max-h-[400px] overflow-auto custom-scrollbar">
                <pre className="text-[13px] leading-relaxed font-mono text-[#d4d4d4]">
                  <code>{JSON.stringify({ priceTable: priceData, additionalServices: additionalData }, null, 2)}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {priceData.length > 0 && (
              <>
                <h3 className="text-lg font-bold tracking-tight text-foreground/80 mt-8">단가표 결과</h3>
                <DynamicTable data={priceData} />
              </>
            )}
            
            {additionalData.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold tracking-tight text-foreground/80 mb-4">부가서비스 및 정책 규정</h3>
                <DynamicTable data={additionalData} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State when no data */}
      {(priceData.length === 0 && additionalData.length === 0) && (
        <Card className="flex h-[200px] flex-col items-center justify-center border-dashed border-2 text-center bg-muted/20">
          <div className="flex flex-col items-center gap-3 text-muted-foreground/60">
            <div className="rounded-full bg-background p-4 shadow-inner ring-1 ring-border">
              <Trash2 className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">분석된 데이터가 없습니다.</p>
              <p className="text-xs">파일을 업로드하고 '정책 분석하기' 버튼을 클릭해 주세요.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
