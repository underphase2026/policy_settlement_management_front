import { useState } from "react"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function ExportButton() {
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null)

  const handleExport = (type: "pdf" | "excel") => {
    setExporting(type)
    // Simulate export delay
    setTimeout(() => {
      setExporting(null)
    }, 1500)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Download className="size-3.5" />
          내보내기
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="flex flex-col gap-1">
          <button
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            onClick={() => handleExport("excel")}
            disabled={exporting !== null}
          >
            {exporting === "excel" ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <FileSpreadsheet className="size-4 text-emerald-600" />
            )}
            엑셀 다운로드 (.xlsx)
          </button>
          <button
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
          >
            {exporting === "pdf" ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <FileText className="size-4 text-destructive" />
            )}
            PDF 다운로드 (.pdf)
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
