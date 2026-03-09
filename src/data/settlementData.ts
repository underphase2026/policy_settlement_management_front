export interface SettlementRecord {
  id: string
  saleDate: string
  customerName: string
  device: string
  plan: string
  agencyName: string
  policyRebate: number
  actualSettlement: number
  difference: number
  status: "completed" | "error" | "pending" | "clawback"
  memo?: string
  policyDetail: Record<string, any>
  agencyDetail: Record<string, any>
}

export interface SummaryData {
  expectedTotal: number
  receivedTotal: number
  outstandingTotal: number
  clawbackTotal: number
}

export const SAMPLE_SETTLEMENT_RECORDS: SettlementRecord[] = [
  {
    id: "1",
    saleDate: "2025-06-01",
    customerName: "김정은",
    device: "갤럭시 S25 Ultra",
    plan: "5G 프리미어 플러스",
    agencyName: "삼성모바일대리점",
    policyRebate: 380000,
    actualSettlement: 380000,
    difference: 0,
    status: "completed",
    policyDetail: { 공시지원금: 300000, 추가지원금: 150000, 판매리베이트: 80000, 부가서비스조건: "V컬러링+스마트피싱", 유지기간: "3개월" },
    agencyDetail: { 공시지원금: 300000, 추가지원금: 150000, 판매리베이트: 80000, 부가서비스조건: "V컬러링+스마트피싱", 유지기간: "3개월" },
  },
  {
    id: "2",
    saleDate: "2025-06-02",
    customerName: "박수정",
    device: "아이폰 16 Pro",
    plan: "슈퍼플랜 베이직",
    agencyName: "KT프라자강남",
    policyRebate: 355000,
    actualSettlement: 305000,
    difference: 50000,
    status: "error",
    memo: "부가서비스 미유지로 리베이트 차감",
    policyDetail: { 공시지원금: 280000, 추가지원금: 100000, 판매리베이트: 75000, 부가서비스조건: "피싱세이프+지니뮤직", 유지기간: "2개월" },
    agencyDetail: { 공시지원금: 280000, 추가지원금: 100000, 판매리베이트: 25000, 부가서비스조건: "피싱세이프", 유지기간: "2개월" },
  },
  {
    id: "3",
    saleDate: "2025-06-03",
    customerName: "이지홍",
    device: "갤럭시 Z 폴드6",
    plan: "유플러스 시그니처",
    agencyName: "LGU+직영대리점",
    policyRebate: 445000,
    actualSettlement: 445000,
    difference: 0,
    status: "completed",
    policyDetail: { 공시지원금: 320000, 추가지원금: 140000, 판매리베이트: 85000, 부가서비스조건: "U+아이돌Live", 유지기간: "3개월" },
    agencyDetail: { 공시지원금: 320000, 추가지원금: 140000, 판매리베이트: 85000, 부가서비스조건: "U+아이돌Live", 유지기간: "3개월" },
  },
  {
    id: "4",
    saleDate: "2025-06-04",
    customerName: "최영수",
    device: "갤럭시 S25+",
    plan: "5G 프리미어 에센셜",
    agencyName: "SK텔링크서초",
    policyRebate: 310000,
    actualSettlement: 310000,
    difference: 0,
    status: "pending",
    policyDetail: { 공시지원금: 250000, 추가지원금: 120000, 판매리베이트: 60000, 부가서비스조건: "V컬러링", 유지기간: "3개월" },
    agencyDetail: { 공시지원금: 250000, 추가지원금: 120000, 판매리베이트: 60000, 부가서비스조건: "V컬러링", 유지기간: "3개월" },
  },
  {
    id: "5",
    saleDate: "2025-06-05",
    customerName: "김도현",
    device: "아이폰 16 Pro Max",
    plan: "슈퍼플랜 스페셜",
    agencyName: "KT프라자강남",
    policyRebate: 530000,
    actualSettlement: 450000,
    difference: 80000,
    status: "error",
    policyDetail: { 공시지원금: 350000, 추가지원금: 180000, 판매리베이트: 90000, 부가서비스조건: "지니TV+지니뮤직", 유지기간: "3개월" },
    agencyDetail: { 공시지원금: 350000, 추가지원금: 100000, 판매리베이트: 90000, 부가서비스조건: "지니TV+지니뮤직", 유지기간: "3개월" },
  },
]
