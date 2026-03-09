import { useState, useRef, useEffect } from "react"
import { AlertCircle, Check, Pencil, X } from "lucide-react"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { type PolicyRow } from "@/data/policyData"

const COLUMNS: { key: keyof Omit<PolicyRow, "id" | "_uncertain">; label: string }[] = [
  { key: "기종명", label: "기종명" },
  { key: "용량", label: "용량" },
  { key: "통신사", label: "통신사" },
  { key: "가입유형", label: "번호이동/기변" },
  { key: "요금제", label: "요금제" },
  { key: "공시지원금", label: "공시지원금" },
  { key: "추가지원금", label: "추가지원금" },
  { key: "판매리베이트", label: "판매 리베이트" },
  { key: "부가서비스조건", label: "부가서비스 조건" },
  { key: "유지기간", label: "유지기간" },
]

function InlineEditCell({
  value,
  isUncertain,
  onSave,
}: {
  value: string
  isUncertain: boolean
  onSave: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = () => {
    onSave(editValue)
    setEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave()
            if (e.key === "Escape") handleCancel()
          }}
          className="h-7 min-w-[80px] text-xs"
        />
        <button
          onClick={handleSave}
          className="shrink-0 rounded p-0.5 text-primary hover:bg-primary/10"
          aria-label="저장"
        >
          <Check className="size-3.5" />
        </button>
        <button
          onClick={handleCancel}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label="취소"
        >
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={cn(
        "group flex items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-xs transition-colors hover:bg-accent",
        isUncertain && "text-destructive font-medium"
      )}
      title={isUncertain ? "확인 필요 - 클릭하여 수정" : "클릭하여 수정"}
    >
      {isUncertain && <AlertCircle className="size-3 shrink-0" />}
      <span className="truncate max-w-[120px]">{value}</span>
      <Pencil className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground" />
    </button>
  )
}

interface DataReviewTableProps {
  data: PolicyRow[]
  onDataChange: (data: PolicyRow[]) => void
}

export function DataReviewTable({ data, onDataChange }: DataReviewTableProps) {
  const handleCellSave = (rowId: string, key: string, value: string) => {
    onDataChange(
      data.map((row) => {
        if (row.id !== rowId) return row
        const updatedRow = { ...row, [key]: value } as PolicyRow
        if (updatedRow._uncertain) {
          updatedRow._uncertain = updatedRow._uncertain.filter((k) => k !== key)
        }
        return updatedRow
      })
    )
  }

  const uncertainCount = data.reduce(
    (acc, row) => acc + (row._uncertain?.length || 0),
    0
  )

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="text-xs">
          총 {data.length}건 추출
        </Badge>
        {uncertainCount > 0 && (
          <Badge
            variant="outline"
            className="border-destructive/30 text-destructive text-xs"
          >
            <AlertCircle className="mr-1 size-3" />
            확인 필요 {uncertainCount}건
          </Badge>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/50 hover:bg-accent/50">
              <TableHead className="w-10 text-center text-xs">#</TableHead>
              {COLUMNS.map((col) => (
                <TableHead key={col.key} className="text-xs">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={row.id}>
                <TableCell className="text-center text-xs text-muted-foreground">
                  {idx + 1}
                </TableCell>
                {COLUMNS.map((col) => {
                  const isUncertain =
                    row._uncertain?.includes(col.key) || false
                  return (
                    <TableCell key={col.key} className="py-1">
                      <InlineEditCell
                        value={row[col.key as keyof Omit<PolicyRow, "id" | "_uncertain">] as string}
                        isUncertain={isUncertain}
                        onSave={(v) =>
                          handleCellSave(row.id, col.key, v)
                        }
                      />
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
