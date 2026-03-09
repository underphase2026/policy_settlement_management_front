import React, { useState, useRef } from "react"
import { UploadCloud, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DynamicTable } from "./dynamic-table"

// 환경 변수(.env)로부터 모든 API 정보를 불러옵니다.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = import.meta.env.VITE_GEMINI_API_ENDPOINT
const GEMINI_PROJECT_NAME = import.meta.env.VITE_GEMINI_PROJECT_NAME
const GEMINI_KEY_NAME = import.meta.env.VITE_GEMINI_KEY_NAME

interface PolicyUploadProps {
  className?: string
}

export function PolicyUpload({ className }: PolicyUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // File객체를 받아 Base64 포맷으로 변환 (Data URI 형태)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (err) => reject(err)
    })
  }

  // Exponential Backoff 및 429(Rate Limit) 대응을 포함한 Gemini API 호출 헬퍼
  const callGeminiWithRetry = async (
    file: File,
    base64String: string,
    planName: string,
    prompt: string,
    maxRetries = 3
  ): Promise<any[]> => {
    let retries = 0
    let delay = 2000 // 일반적인 재시도 지연 시간

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
                    text: `${prompt}\n\n[공통 필수 규칙]\n- 마크다운을 제외한 순수 JSON 배열만 반환하세요.\n- 단말기 모델명, 요금제명, 단가(MNP/기변), 부가서비스 조건이 반드시 포함되어야 합니다.\n- 데이터를 절대 요약('표 참조' 등)하지 마세요.`,
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

        // 429(Rate Limit/Quota Exceeded) 에러 대응
        if (response.status === 429) {
          if (retries < maxRetries) {
            retries++
            console.warn(`[${planName}] Quota Exceeded (429). 21초 대기 후 재시도합니다... (${retries}/${maxRetries})`)
            await new Promise((resolve) => setTimeout(resolve, 21000))
            continue
          }
        }

        // 503(Service Unavailable) 에러 대응
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
        const parsed = JSON.parse(cleanJsonString)
        return Array.isArray(parsed) ? parsed : [parsed]
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

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("지원하지 않는 형식입니다. 이미지 파일만 업로드해 주세요.")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const base64Data = await fileToBase64(file)
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

      const mergedResult: any[] = []

      // 순차 호출 (Sequential Call)로 변경하여 Rate Limit 방지
      for (let i = 0; i < prompts.length; i++) {
        const p = prompts[i]
        const planResult = await callGeminiWithRetry(file, base64String, p.plan || `Plan-${i}`, p.prompt)
        mergedResult.push(...planResult)

        // 마지막 호출이 아니면 3초 대기
        if (i < prompts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      }
      
      if (mergedResult.length === 0) {
        throw new Error("이미지에서 데이터를 추출하지 못했습니다. 이미지 화질이나 요금제 구간을 확인해 주세요.")
      }

      setResult(mergedResult)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "데이터 분석 중 오류가 발생했습니다.")
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
      processFile(e.dataTransfer.files[0])
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0])
    }
    // 동일한 파일 재선택 가능하게 value 초기화
    e.target.value = ""
  }

  return (
    <div className={cn("space-y-6 w-full max-w-4xl", className)}>
      {/* 1. 파일 업로드 영역 (드래그 앤 드롭) */}
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
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium">요금제별 데이터를 순차적으로 분석 중입니다...</p>
              <p className="text-xs">데이터 정밀도를 위해 약 10~15초가 소요됩니다.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="rounded-full bg-accent p-4">
              <UploadCloud className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">정책표 이미지를 드래그하거나 클릭하여 업로드</p>
              <p className="text-xs">JPG, PNG 등의 이미지 형식 지원</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. 에러 알림 */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-4 text-sm text-destructive font-medium border border-destructive/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* 3. 분석 결과 (JSON) 출력 영역 */}
      {result && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="font-semibold text-foreground">데이터 추출 완료</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            업로드하신 이미지로부터 분석된 JSON 형태의 정책 데이터입니다.
          </p>
          <div className="relative overflow-hidden rounded-lg bg-[#282a36] p-5">
            <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#f8f8f2]">
              <code>{JSON.stringify(result, null, 2)}</code>
            </pre>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-foreground/70">데이터 시각화 (표)</h4>
            <DynamicTable data={result} />
          </div>
        </div>
      )}
      {/* 4. 프로젝트 메타데이터 표시 (개발자 확인용) */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50 text-[10px] text-muted-foreground/60">
        <div className="flex gap-3">
          <span>프로젝트: <span className="font-mono">{GEMINI_PROJECT_NAME}</span></span>
          <span>키: <span className="font-mono">{GEMINI_KEY_NAME}</span></span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-emerald-500" />
          <span>API Connected</span>
        </div>
      </div>
    </div>
  )
}

export default PolicyUpload
