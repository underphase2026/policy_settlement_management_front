import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, Share2, Trash2 } from "lucide-react"

import { FileUploadDropzone, type UploadedFile } from "@/components/policy/file-upload-dropzone"
import { AnalysisProcess } from "@/components/policy/analysis-process"
import { DynamicTable } from "@/components/policy/dynamic-table"
import { type PolicyRow } from "@/data/policyData"
import { cn } from "@/lib/utils"

// 환경 변수(.env)로부터 모든 API 정보를 불러옵니다.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = import.meta.env.VITE_GEMINI_API_ENDPOINT

export default function PolicyExtractionPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "analyzing" | "complete" | "error">("idle")
  const [extractedData, setExtractedData] = useState<PolicyRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFilesAdded = useCallback((newFiles: UploadedFile[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    setAnalysisStatus("idle") // Reset analysis on new files
    setError(null)
  }, [])

  const handleFileRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    if (files.length <= 1) {
      setAnalysisStatus("idle")
      setExtractedData([])
      setError(null)
    }
  }, [files])

  // File객체를 받아 Base64 포맷으로 변환
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (err) => reject(err)
    })
  }

  // Exponential Backoff 및 429 대응을 포함한 Gemini API 호출 헬퍼
  const callGeminiWithRetry = async (
    file: File,
    base64String: string,
    planName: string,
    prompt: string,
    maxRetries = 3
  ): Promise<any[]> => {
    let retries = 0
    let delay = 2000

    while (retries <= maxRetries) {
      try {
        const response = await fetch(GEMINI_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${prompt}\n\n[공통 필수 규칙]\n- 마크다운을 제외한 순수 JSON 배열만 반환하세요.\n- 단말기 모델명, 요금제명, 단가(MNP/기변), 부가서비스 조건이 반드시 포함되어야 합니다.\n- 데이터를 절대 요약하지 마세요.`,
                  },
                  {
                    inlineData: {
                      mimeType: file.type,
                      data: base64String,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        })

        // 429(Rate Limit) 대응
        if (response.status === 429) {
          if (retries < maxRetries) {
            retries++
            console.warn(`[${planName}] Quota Exceeded (429). 21초 대기 후 재시도합니다... (${retries}/${maxRetries})`)
            await new Promise((resolve) => setTimeout(resolve, 21000))
            continue
          }
        }

        // 503(Service Unavailable) 대응
        if (response.status === 503) {
          if (retries < maxRetries) {
            retries++
            console.warn(`[${planName}] 서버 과부하 (503). ${delay}ms 후 재시도합니다...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            delay *= 2
            continue
          }
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData?.error?.message || `API 오류 (${response.status})`)
        }

        const data = await response.json()
        const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!extractedText) return []

        const cleanJsonString = extractedText.replace(/```json\n?|\n?```/g, "").trim()
        const parsedData = JSON.parse(cleanJsonString)
        return Array.isArray(parsedData) ? parsedData : [parsedData]
      } catch (err) {
        if (retries < maxRetries) {
          retries++
          await new Promise((resolve) => setTimeout(resolve, delay))
          delay *= 2
          continue
        }
        throw err
      }
    }
    return []
  }

  const handleAnalysisStart = useCallback(async () => {
    if (files.length === 0) return

    setError(null)
    try {
      const lastFile = files[files.length - 1].file
      if (!lastFile) throw new Error("업로드된 파일 객체를 찾을 수 없습니다.")

      const base64Data = await fileToBase64(lastFile)
      const base64String = base64Data.split(",")[1]

      const prompts = [
        {
          plan: "115K",
          prompt: "첨부된 단가표 이미지에서 오직 '115,000원(115K, 115군 등 포함)' 요금제에 해당하는 데이터만 찾아서 모든 단말기의 MNP/기변 단가를 추출해 JSON 배열로 반환해. 반드시 반환하는 JSON 객체의 Key 값을 다음 6개로 정확히 통일하세요: '모델코드', '모델명', '요금제명', 'MNP단가', '기변단가', '부가서비스'. 절대 임의의 영문 Key나 다른 이름을 사용하면 안 됩니다."
        },
        {
          plan: "105K",
          prompt: "첨부된 단가표 이미지에서 오직 '105,000원(105K, 105군 등 포함)' 요금제에 해당하는 데이터만 찾아서 모든 단말기의 MNP/기변 단가를 추출해 JSON 배열로 반환해. 반드시 반환하는 JSON 객체의 Key 값을 다음 6개로 정확히 통일하세요: '모델코드', '모델명', '요금제명', 'MNP단가', '기변단가', '부가서비스'. 절대 임의의 영문 Key나 다른 이름을 사용하면 안 됩니다."
        },
        {
          plan: "95K",
          prompt: "첨부된 단가표 이미지에서 오직 '95,000원(95K, 95군 등 포함)' 요금제에 해당하는 데이터만 찾아서 모든 단말기의 MNP/기변 단가를 추출해 JSON 배열로 반환해. 반드시 반환하는 JSON 객체의 Key 값을 다음 6개로 정확히 통일하세요: '모델코드', '모델명', '요금제명', 'MNP단가', '기변단가', '부가서비스'. 절대 임의의 영문 Key나 다른 이름을 사용하면 안 됩니다."
        }
      ]

      const mergedData: any[] = []

      // 순차 호출로 변경
      for (let i = 0; i < prompts.length; i++) {
        const p = prompts[i]
        const planResult = await callGeminiWithRetry(lastFile, base64String, p.plan || `Plan-${i}`, p.prompt)
        mergedData.push(...planResult)

        if (i < prompts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      }
      
      if (mergedData.length === 0) {
        throw new Error("분석 결과를 추출할 수 없습니다.")
      }

      setExtractedData(mergedData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "분석 중 예기치 못한 오류가 발생했습니다.")
      throw err
    }
  }, [files])


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">정책표 자동 데이터 추출</h1>
          <p className="text-muted-foreground text-sm">
            정책표 파일(이미지/엑셀)을 업로드하면 자동으로 데이터를 추출하여 상담 시스템에 등록할 수 있습니다.
          </p>
        </div>
        
        {/* Stepper Logic Component */}
        <div className="flex flex-wrap items-center gap-4 py-2 overflow-x-auto no-scrollbar">
          {[
            { step: 1, label: "파일 업로드", active: files.length === 0 || (files.length > 0 && analysisStatus === 'idle') },
            { step: 2, label: "분석", active: analysisStatus === 'analyzing' || analysisStatus === 'complete' },
            { step: 3, label: "검토 및 매핑", active: extractedData.length > 0 },
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
      {extractedData.length > 0 && (
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
            <CardHeader className="bg-muted/30 border-b border-border/50 py-3 px-6">
              <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Extracted Data Output (JSON)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-[#1e1e1e] p-6 max-h-[400px] overflow-auto custom-scrollbar">
                <pre className="text-[13px] leading-relaxed font-mono text-[#d4d4d4]">
                  <code>{JSON.stringify(extractedData, null, 2)}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-bold tracking-tight text-foreground/80">추출 결과 (표)</h3>
            <DynamicTable data={extractedData} />
          </div>
        </div>
      )}

      {/* Empty State when no data */}
      {extractedData.length === 0 && (
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
