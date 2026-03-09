import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export type SettlementStatus = "all" | "pending" | "completed" | "error" | "clawback"

export interface FilterState {
  period: "week" | "month" | "custom"
  dateFrom: Date | undefined
  dateTo: Date | undefined
  agency: string
  status: SettlementStatus
  search: string
}

const STATUS_OPTIONS = [
  { value: "all", label: "전체 상태" },
  { value: "pending", label: "정산대기" },
  { value: "completed", label: "정산완료" },
  { value: "error", label: "오차발생" },
  { value: "clawback", label: "환수발생" },
]

const AGENCY_OPTIONS = [
  { value: "all", label: "전체 대리점" },
  { value: "삼성모바일대리점", label: "삼성모바일대리점" },
  { value: "KT프라자강남", label: "KT프라자강남" },
  { value: "LGU+직영대리점", label: "LGU+직영대리점" },
  { value: "SK텔링크서초", label: "SK텔링크서초" },
  { value: "투플러스통신", label: "투플러스통신" },
]

function DatePickerButton({
  date,
  onSelect,
  placeholder,
}: {
  date: Date | undefined
  onSelect: (d: Date | undefined) => void
  placeholder: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 w-[140px] justify-start text-left text-xs font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="size-3.5" />
          {date ? format(date, "yyyy-MM-dd") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          locale={ko}
        />
      </PopoverContent>
    </Popover>
  )
}

export function SettlementFilters({
  filters,
  onFiltersChange,
}: {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}) {
  const handlePeriodChange = (period: "week" | "month" | "custom") => {
    const now = new Date()
    let dateFrom: Date | undefined
    let dateTo: Date | undefined = now

    if (period === "week") {
      dateFrom = new Date(now)
      dateFrom.setDate(now.getDate() - 7)
    } else if (period === "month") {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    onFiltersChange({ ...filters, period, dateFrom, dateTo })
  }

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.agency !== "all" ||
    filters.search !== ""

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Period + Date Range */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
          {(["week", "month", "custom"] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filters.period === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p === "week" ? "주간" : p === "month" ? "월간" : "기간 선택"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <DatePickerButton
            date={filters.dateFrom}
            onSelect={(d) => onFiltersChange({ ...filters, dateFrom: d, period: "custom" })}
            placeholder="시작일"
          />
          <span className="text-xs text-muted-foreground">~</span>
          <DatePickerButton
            date={filters.dateTo}
            onSelect={(d) => onFiltersChange({ ...filters, dateTo: d, period: "custom" })}
            placeholder="종료일"
          />
        </div>
      </div>

      {/* Row 2: Search + Agency + Status + Clear */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="고객명 또는 단말기 검색..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="h-9 pl-9 text-xs"
          />
        </div>

        <Select
          value={filters.agency}
          onValueChange={(v) => onFiltersChange({ ...filters, agency: v })}
        >
          <SelectTrigger className="h-9 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGENCY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, status: v as SettlementStatus })
          }
        >
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-muted-foreground"
            onClick={() =>
              onFiltersChange({
                ...filters,
                status: "all",
                agency: "all",
                search: "",
              })
            }
          >
            <X className="size-3.5" />
            필터 초기화
          </Button>
        )}
      </div>
    </div>
  )
}
