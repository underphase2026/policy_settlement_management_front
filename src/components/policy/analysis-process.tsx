import { useState, useEffect, useCallback } from "react"
import { ScanSearch, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type AnalysisStatus = "idle" | "analyzing" | "complete" | "error"

interface AnalysisStep {
  label: string
  description: string
}

const STEPS: AnalysisStep[] = [
  { label: "파일 검증", description: "업로드된 파일의 형식 및 무결성 확인" },
  { label: "OCR / 데이터 파싱", description: "이미지 텍스트 추출 및 엑셀 데이터 파싱" },
  { label: "정책 항목 식별", description: "기종, 요금제, 지원금 등 항목 매칭" },
  { label: "데이터 검증", description: "추출 데이터의 정합성 및 누락 검사" },
]

interface AnalysisProcessProps {
  hasFiles: boolean
  onAnalysisStart: () => Promise<void>
  status: AnalysisStatus
  setStatus: (s: AnalysisStatus) => void
  error?: string | null
}

export function AnalysisProcess({
  hasFiles,
  onAnalysisStart,
  status,
  setStatus,
  error,
}: AnalysisProcessProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(-1)

  const handleRunAnalysis = useCallback(async () => {
    setStatus("analyzing")
    setProgress(0)
    setCurrentStep(0)

    // 애니메이션 효과를 위한 인터벌
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        const next = prev + Math.random() * 5
        const newStep = Math.min(
          STEPS.length - 1,
          Math.floor((next / 100) * STEPS.length)
        )
        setCurrentStep(newStep)
        return next
      })
    }, 500)

    try {
      await onAnalysisStart()
      clearInterval(interval)
      setProgress(100)
      setCurrentStep(STEPS.length)
      setStatus("complete")
    } catch (err) {
      clearInterval(interval)
      setStatus("error")
    }
  }, [onAnalysisStart, setStatus])

  useEffect(() => {
    if (status === "idle") {
      setProgress(0)
      setCurrentStep(-1)
    }
  }, [status])

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <ScanSearch className="size-5 text-primary" />
          분석 프로세스
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 flex flex-col h-full">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>
              {status === "idle" && "분석 대기 중"}
              {status === "analyzing" && "요금제별 데이터를 동시에 분석 중입니다. (약 5~10초 소요)"}
              {status === "complete" && "분석 완료"}
              {status === "error" && "분석 오류 발생"}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-3 flex-grow overflow-y-auto no-scrollbar">
          {STEPS.map((step, i) => {
            const isActive = status === "analyzing" && currentStep === i
            const isDone =
              status === "complete" ||
              (status === "analyzing" && currentStep > i)

            return (
              <div
                key={step.label}
                className={cn(
                  "flex items-start gap-4 rounded-xl border p-3.5 transition-all duration-300",
                  isActive
                    ? "border-primary ring-1 ring-primary/20 bg-primary/5 shadow-sm"
                    : isDone
                    ? "border-border bg-accent/20"
                    : "border-border bg-muted/30 opacity-60"
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="size-5 text-primary" />
                  ) : isActive ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p
                    className={cn(
                      "text-sm font-semibold leading-none",
                      isActive || isDone
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground/80 leading-snug">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Error message */}
        {error && status === "error" && (
          <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-medium">
            오류: {error}
          </div>
        )}

        {/* Action button */}
        <Button
          className="w-full h-11 text-sm font-bold shadow-sm"
          disabled={!hasFiles || status === "analyzing"}
          onClick={handleRunAnalysis}
        >
          {status === "analyzing" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin font-bold" />
              분석 진행 중...
            </>
          ) : status === "complete" ? (
            "다시 분석하기"
          ) : (
            "정책 분석하기"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
