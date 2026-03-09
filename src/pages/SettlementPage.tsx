import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileDown, RefreshCcw } from "lucide-react"

import { SettlementSummaryCards } from "@/components/settlement/summary-cards"
import { SettlementFilters, type FilterState, type SettlementStatus } from "@/components/settlement/settlement-filters"
import { ReconciliationTable } from "@/components/settlement/reconciliation-table"
import { SettlementDetailModal } from "@/components/settlement/detail-modal"
import { ExportButton } from "@/components/settlement/export-button"

import { SAMPLE_SETTLEMENT_RECORDS, type SettlementRecord } from "@/data/settlementData"

export default function SettlementPage() {
  const [records, setRecords] = useState<SettlementRecord[]>(SAMPLE_SETTLEMENT_RECORDS)
  const [filters, setFilters] = useState<FilterState>({
    period: "month",
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    dateTo: new Date(),
    agency: "all",
    status: "all",
    search: "",
  })

  const [selectedRecord, setSelectedRecord] = useState<SettlementRecord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Calculated summary
  const summary = useMemo(() => {
    return records.reduce(
      (acc, curr) => {
        acc.expectedTotal += curr.policyRebate
        acc.receivedTotal += curr.actualSettlement
        acc.outstandingTotal += curr.difference
        if (curr.status === "clawback") {
          acc.clawbackTotal += curr.difference
        }
        return acc
      },
      { expectedTotal: 0, receivedTotal: 0, outstandingTotal: 0, clawbackTotal: 0 }
    )
  }, [records])

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Agency filter
      if (filters.agency !== "all" && r.agencyName !== filters.agency) return false
      // Status filter
      if (filters.status !== "all" && r.status !== filters.status) return false
      // Search filter
      if (filters.search) {
        const s = filters.search.toLowerCase()
        return (
          r.customerName.toLowerCase().includes(s) ||
          r.device.toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [records, filters])

  const handleRowClick = useCallback((record: SettlementRecord) => {
    setSelectedRecord(record)
    setModalOpen(true)
  }, [])

  const handleSaveMemo = useCallback((id: string, memo: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, memo } : r))
    )
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Summary */}
      <SettlementSummaryCards
        data={summary}
        onOutstandingClick={() => setFilters({ ...filters, status: "error" })}
      />

      {/* Filter & Table Area */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-bold">정산 대조 내역</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 px-3 text-xs">
              <RefreshCcw className="mr-2 size-3.5" />
              대조 업데이트
            </Button>
            <ExportButton />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <SettlementFilters filters={filters} onFiltersChange={setFilters} />
          <ReconciliationTable
            data={filteredRecords}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <SettlementDetailModal
        record={selectedRecord}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSaveMemo={handleSaveMemo}
      />
    </div>
  )
}
