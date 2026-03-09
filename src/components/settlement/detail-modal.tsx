import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Save } from "lucide-react"
import { type SettlementRecord } from "@/data/settlementData"

function formatKRW(value: number): string {
  return value.toLocaleString("ko-KR") + "원"
}

const STATUS_MAP: Record<
  SettlementRecord["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "정산대기", variant: "secondary" },
  completed: { label: "정산완료", variant: "default" },
  error: { label: "오차발생", variant: "destructive" },
  clawback: { label: "환수발생", variant: "outline" },
}

function ComparisonRow({
  label,
  policyValue,
  agencyValue,
  isNumeric = false,
}: {
  label: string
  policyValue: string | number
  agencyValue: string | number
  isNumeric?: boolean
}) {
  const policyStr = isNumeric ? formatKRW(policyValue as number) : String(policyValue)
  const agencyStr = isNumeric ? formatKRW(agencyValue as number) : String(agencyValue)
  const mismatch = policyStr !== agencyStr

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] items-center border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-foreground tabular-nums">{policyStr}</span>
      <span
        className={
          mismatch
            ? "font-semibold text-destructive tabular-nums"
            : "text-foreground tabular-nums"
        }
      >
        {agencyStr}
        {mismatch && (
          <span className="ml-1.5 text-[10px] font-normal text-destructive">
            불일치
          </span>
        )}
      </span>
    </div>
  )
}

export function SettlementDetailModal({
  record,
  open,
  onOpenChange,
  onSaveMemo,
}: {
  record: SettlementRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveMemo: (id: string, memo: string) => void
}) {
  const [memo, setMemo] = useState("")
  const [saving, setSaving] = useState(false)

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && record) {
      setMemo(record.memo || "")
    }
    onOpenChange(isOpen)
  }

  const handleSaveMemo = () => {
    if (!record) return
    setSaving(true)
    setTimeout(() => {
      onSaveMemo(record.id, memo)
      setSaving(false)
    }, 500)
  }

  if (!record) return null

  const statusInfo = STATUS_MAP[record.status]

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            정산 상세 내역
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            {record.saleDate} | {record.customerName} | {record.device}
          </DialogDescription>
        </DialogHeader>

        {/* Basic info */}
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-4">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground">고객명</span>
            <p className="text-sm font-medium text-foreground">{record.customerName}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground">대리점</span>
            <p className="text-sm font-medium text-foreground">{record.agencyName}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground">단말기</span>
            <p className="text-sm font-medium text-foreground">{record.device}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground">요금제</span>
            <p className="text-sm font-medium text-foreground">{record.plan}</p>
          </div>
        </div>

        {/* Side-by-side comparison */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">정책 vs 실제 정산 비교</h4>
          <div className="rounded-lg border border-border">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border bg-muted/50 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              <span>항목</span>
              <span>정책표 (A)</span>
              <span>대리점 정산 (B)</span>
            </div>
            {/* Rows */}
            <div className="px-4">
              <ComparisonRow
                label="공시지원금"
                policyValue={record.policyDetail.공시지원금}
                agencyValue={record.agencyDetail.공시지원금}
                isNumeric
              />
              <ComparisonRow
                label="추가지원금"
                policyValue={record.policyDetail.추가지원금}
                agencyValue={record.agencyDetail.추가지원금}
                isNumeric
              />
              <ComparisonRow
                label="판매리베이트"
                policyValue={record.policyDetail.판매리베이트}
                agencyValue={record.agencyDetail.판매리베이트}
                isNumeric
              />
              <ComparisonRow
                label="부가서비스조건"
                policyValue={record.policyDetail.부가서비스조건}
                agencyValue={record.agencyDetail.부가서비스조건}
              />
              <ComparisonRow
                label="유지기간"
                policyValue={record.policyDetail.유지기간}
                agencyValue={record.agencyDetail.유지기간}
              />
            </div>
          </div>
        </div>

        {/* Difference summary */}
        <div
          className={`flex items-center justify-between rounded-lg p-4 ${
            record.difference !== 0
              ? "bg-destructive/10 border border-destructive/20"
              : "bg-emerald-50 border border-emerald-200"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">정산 차액 (A - B)</span>
            <p
              className={`text-lg font-bold tabular-nums ${
                record.difference !== 0 ? "text-destructive" : "text-emerald-600"
              }`}
            >
              {record.difference > 0 ? "+" : ""}
              {formatKRW(record.difference)}
            </p>
          </div>
          {record.difference !== 0 && (
            <span className="text-xs text-destructive font-medium">
              정산 오차가 존재합니다
            </span>
          )}
        </div>

        {/* Memo */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">
            오차 사유 메모
          </h4>
          <Textarea
            placeholder="정산이 틀린 이유를 메모하세요. (예: 부가서비스 미유지, 요금제 하향 등)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="min-h-20 text-sm"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
          <Button onClick={handleSaveMemo} disabled={saving}>
            <Save className="size-4" />
            {saving ? "저장 중..." : "메모 저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
