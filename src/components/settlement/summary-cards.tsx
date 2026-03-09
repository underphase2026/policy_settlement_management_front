import {
  Wallet,
  CircleCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { type SummaryData } from "@/data/settlementData"

function formatKRW(value: number): string {
  return value.toLocaleString("ko-KR") + "원"
}

export function SettlementSummaryCards({
  data,
  onOutstandingClick,
}: {
  data: SummaryData
  onOutstandingClick?: () => void
}) {
  const cards = [
    {
      label: "이번 달 정산 예정액",
      value: data.expectedTotal,
      icon: Wallet,
      accent: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "입금 완료액",
      value: data.receivedTotal,
      icon: CircleCheck,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "정산 차액 (미수금)",
      value: data.outstandingTotal,
      icon: AlertTriangle,
      accent: data.outstandingTotal > 0 ? "text-destructive" : "text-emerald-600",
      bg: data.outstandingTotal > 0 ? "bg-destructive/10" : "bg-emerald-50",
      showAction: data.outstandingTotal > 0,
    },
    {
      label: "환수/차감 총액",
      value: data.clawbackTotal,
      icon: RotateCcw,
      accent: data.clawbackTotal > 0 ? "text-amber-600" : "text-muted-foreground",
      bg: data.clawbackTotal > 0 ? "bg-amber-50" : "bg-muted/50",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="gap-0 py-0">
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.bg}`}
            >
              <card.icon className={`size-5 ${card.accent}`} />
            </div>
            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <span className="text-xs text-muted-foreground font-medium truncate">
                {card.label}
              </span>
              <span
                className={`text-lg font-bold tabular-nums leading-tight ${card.accent}`}
              >
                {formatKRW(card.value)}
              </span>
              {card.showAction && onOutstandingClick && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-destructive justify-start"
                  onClick={onOutstandingClick}
                >
                  내역 확인
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
