import { useState, useMemo } from "react"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type SettlementRecord } from "@/data/settlementData"

type SortField = "saleDate" | "customerName" | "device" | "plan" | "agencyName" | "policyRebate" | "actualSettlement" | "difference"
type SortDirection = "asc" | "desc"

const PAGE_SIZE = 10

const STATUS_MAP: Record<
  SettlementRecord["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "정산대기", variant: "secondary" },
  completed: { label: "정산완료", variant: "default" },
  error: { label: "오차발생", variant: "destructive" },
  clawback: { label: "환수발생", variant: "outline" },
}

function formatKRW(value: number): string {
  return value.toLocaleString("ko-KR") + "원"
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentDirection: SortDirection
  onSort: (field: SortField) => void
}) {
  const isActive = currentSort === field
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      {label}
      {isActive ? (
        currentDirection === "asc" ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-40" />
      )}
    </button>
  )
}

export function ReconciliationTable({
  data,
  onRowClick,
}: {
  data: SettlementRecord[]
  onRowClick: (record: SettlementRecord) => void
}) {
  const [sortField, setSortField] = useState<SortField>("saleDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [page, setPage] = useState(0)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
    setPage(0)
  }

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const dir = sortDirection === "asc" ? 1 : -1

      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * dir
      }
      return String(aVal).localeCompare(String(bVal), "ko") * dir
    })
  }, [data, sortField, sortDirection])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs">
                <SortableHeader
                  label="판매일자"
                  field="saleDate"
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs">
                <SortableHeader
                  label="고객명"
                  field="customerName"
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs">
                <SortableHeader
                  label="단말기"
                  field="device"
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs">
                <SortableHeader
                  label="요금제"
                  field="plan"
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs">대리점명</TableHead>
              <TableHead className="text-xs text-right">
                <SortableHeader
                  label="정책 리베이트(A)"
                  field="policyRebate"
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs text-right">
                <SortableHeader
                  label="실제 정산액(B)"
                  field="actualSettlement"
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs text-right">
                <SortableHeader
                  label="차액(A-B)"
                  field="difference"
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs text-center">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-muted-foreground"
                >
                  조회된 정산 내역이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((record) => {
                const hasError = record.difference !== 0
                const statusInfo = STATUS_MAP[record.status]
                return (
                  <TableRow
                    key={record.id}
                    className={`cursor-pointer transition-colors ${
                      hasError
                        ? "bg-destructive/5 hover:bg-destructive/10"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => onRowClick(record)}
                  >
                    <TableCell className="text-xs">{record.saleDate}</TableCell>
                    <TableCell className="text-xs font-medium">
                      {record.customerName}
                    </TableCell>
                    <TableCell className="text-xs">{record.device}</TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">
                      {record.plan}
                    </TableCell>
                    <TableCell className="text-xs">{record.agencyName}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">
                      {formatKRW(record.policyRebate)}
                    </TableCell>
                    <TableCell className="text-xs text-right tabular-nums">
                      {formatKRW(record.actualSettlement)}
                    </TableCell>
                    <TableCell
                      className={`text-xs text-right tabular-nums font-semibold ${
                        hasError ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {record.difference > 0 ? "+" : ""}
                      {formatKRW(record.difference)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusInfo.variant} className="text-[10px]">
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            전체 {data.length}건 중 {page * PAGE_SIZE + 1}-
            {Math.min((page + 1) * PAGE_SIZE, data.length)}건
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">이전 페이지</span>
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={page === i ? "default" : "outline"}
                size="icon-sm"
                onClick={() => setPage(i)}
                className="text-xs"
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">다음 페이지</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
