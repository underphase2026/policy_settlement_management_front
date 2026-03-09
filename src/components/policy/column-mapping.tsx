import { ArrowRight, Link2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const EXTRACTED_COLUMNS = [
  "기종명",
  "용량",
  "통신사",
  "가입유형",
  "요금제",
  "공시지원금",
  "추가지원금",
  "판매리베이트",
  "부가서비스조건",
  "유지기간",
]

const DB_FIELDS = [
  { value: "device_name", label: "device_name (기종명)" },
  { value: "storage", label: "storage (용량)" },
  { value: "carrier", label: "carrier (통신사)" },
  { value: "subscription_type", label: "subscription_type (가입유형)" },
  { value: "plan_name", label: "plan_name (요금제)" },
  { value: "official_subsidy", label: "official_subsidy (공시지원금)" },
  { value: "extra_subsidy", label: "extra_subsidy (추가지원금)" },
  { value: "rebate", label: "rebate (리베이트)" },
  { value: "vas_condition", label: "vas_condition (부가서비스조건)" },
  { value: "retention_period", label: "retention_period (유지기간)" },
  { value: "none", label: "매핑 안함" },
]

interface ColumnMappingProps {
  mappings: Record<string, string>
  onMappingChange: (source: string, target: string) => void
}

export function ColumnMapping({ mappings, onMappingChange }: ColumnMappingProps) {
  const mappedCount = Object.values(mappings).filter((v) => v && v !== "none").length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-5 text-primary" />
            시스템 연동 설정
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {mappedCount}/{EXTRACTED_COLUMNS.length} 매핑 완료
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-3 px-2 pb-2">
            <p className="text-xs font-medium text-muted-foreground">추출된 컬럼</p>
            <div />
            <p className="text-xs font-medium text-muted-foreground">시스템 DB 필드</p>
          </div>

          {/* Mapping rows */}
          {EXTRACTED_COLUMNS.map((col) => (
            <div
              key={col}
              className="grid grid-cols-[1fr_24px_1fr] items-center gap-3 rounded-lg border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span className="text-sm font-medium text-foreground">{col}</span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
              <Select
                value={mappings[col] || ""}
                onValueChange={(val) => onMappingChange(col, val)}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue placeholder="필드 선택" />
                </SelectTrigger>
                <SelectContent>
                  {DB_FIELDS.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
