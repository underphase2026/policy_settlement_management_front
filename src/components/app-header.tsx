import { Menu, Bell } from "lucide-react"
import { useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"

const PAGE_TITLES: Record<string, string> = {
  "/": "대시보드",
  "/policy": "정책표 자동 데이터 추출",
  "/settlement": "정산 관리",
}

export function AppHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  const location = useLocation()
  const pathname = location.pathname
  const title = PAGE_TITLES[pathname] || "요정"

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-border bg-primary px-4 md:px-6">
      {/* Left: menu + page title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="text-primary-foreground hover:bg-primary-foreground/10 lg:hidden"
          aria-label="메뉴 열기"
        >
          <Menu className="size-5" />
        </Button>
        <h1 className="text-sm font-semibold text-primary-foreground md:text-base">
          {title}
        </h1>
      </div>

      {/* Center: logo icon */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-9 w-9 overflow-hidden rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
        <img 
          src="/images/yojeong-logo.png" 
          alt="요정 로고" 
          className="h-full w-full object-cover" 
        />
      </div>

      {/* Right: notifications */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-primary-foreground hover:bg-primary-foreground/10"
          aria-label="알림"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      </div>
    </header>
  )
}
