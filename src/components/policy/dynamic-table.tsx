import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DynamicTableProps {
  data: any
  className?: string
}

export function DynamicTable({ data, className }: DynamicTableProps) {
  // 데이터가 유효하지 않은 경우
  if (!data || (typeof data !== "object" && !Array.isArray(data))) {
    return (
      <div className="p-8 text-center border rounded-lg bg-muted/20 border-dashed">
        <p className="text-sm text-muted-foreground">표로 변환할 수 없는 데이터 형식입니다.</p>
      </div>
    )
  }

  // 1. 데이터가 배열인 경우 (Array of Objects)
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div className="p-4 text-center border rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground">데이터가 비어 있습니다.</p>
        </div>
      )
    }

    // 모든 행을 순회하며 존재하는 모든 고유 키(Unique Keys)를 추출
    const headers = Array.from(
      new Set(data.flatMap((obj: any) => Object.keys(obj)))
    )

    return (
      <div className={cn("overflow-x-auto rounded-md border border-border shadow-sm", className)}>
        <Table>
          <TableHeader className="bg-muted/80 sticky top-0 z-10">
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="font-extrabold text-foreground whitespace-nowrap border-r border-border/50 last:border-0">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => {
              // 요금제명에 따른 배경색 변화 (선택 사항)
              const plan = String(row["요금제명"] || row["planName"] || "").toLowerCase()
              const rowBg = plan.includes("115") 
                ? "bg-primary/5 hover:bg-primary/10" 
                : plan.includes("105") 
                ? "bg-muted/40 hover:bg-muted/50" 
                : plan.includes("95") 
                ? "bg-background hover:bg-muted/30"
                : "bg-background hover:bg-muted/20"

              return (
                <TableRow key={rowIndex} className={cn("transition-colors border-b", rowBg)}>
                  {headers.map((header) => {
                    const value = row[header]
                    return (
                      <TableCell key={header} className="text-sm border-r border-border/30 last:border-0 py-3">
                        {typeof value === "object" && value !== null
                          ? JSON.stringify(value)
                          : value !== undefined && value !== "" ? String(value) : "-"}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  // 2. 데이터가 객체인데 내부가 배열들인 경우 (예: { "단가표": [...], "부가서비스": [...] })
  const entries = Object.entries(data)
  const hasMultipleArrays = entries.every(([_, value]) => Array.isArray(value))

  if (hasMultipleArrays && entries.length > 0) {
    return (
      <div className={cn("space-y-8", className)}>
        {entries.map(([key, value]) => (
          <div key={key} className="space-y-3">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              {key}
            </h3>
            <DynamicTable data={value} />
          </div>
        ))}
      </div>
    )
  }

  // 3. 단순 객체인 경우 (Key-Value 쌍으로 세로 표 렌더링)
  return (
    <div className={cn("overflow-x-auto rounded-md border border-border shadow-sm", className)}>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-bold text-foreground w-1/3">항목(Key)</TableHead>
            <TableHead className="font-bold text-foreground">내용(Value)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(([key, value], idx) => (
            <TableRow key={key} className={idx % 2 === 1 ? "bg-muted/20" : "bg-background"}>
              <TableCell className="font-medium text-xs font-mono">{key}</TableCell>
              <TableCell className="text-sm">
                {typeof value === "object" && value !== null
                  ? JSON.stringify(value)
                  : String(value ?? "")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
