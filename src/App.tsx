import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { DashboardLayout } from "@/components/dashboard-layout"
import SettlementPage from "@/pages/SettlementPage"
import PolicyExtractionPage from "@/pages/PolicyExtractionPage"

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/settlement" replace />} />
          <Route path="/settlement" element={<SettlementPage />} />
          <Route path="/policy" element={<PolicyExtractionPage />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/settlement" replace />} />
        </Routes>
      </DashboardLayout>
    </Router>
  )
}

export default App
