import { Link, useLocation } from "react-router-dom"
import {
  Home,
  FileSpreadsheet,
  Users,
  Phone,
  BarChart3,
  Settings,
  ClipboardList,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "대시보드", href: "/", icon: Home },
  { label: "상담 관리", href: "#", icon: Phone },
  { label: "정책표 관리", href: "/policy", icon: FileSpreadsheet },
  { label: "정산 관리", href: "/settlement", icon: ClipboardList },
  { label: "고객 관리", href: "#", icon: Users },
  { label: "통계", href: "#", icon: BarChart3 },
  { label: "설정", href: "#", icon: Settings },
]

export function AppSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-border px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 overflow-hidden rounded-lg">
            <img 
              src="/images/yojeong-logo.png" 
              alt="요정 로고" 
              className="h-full w-full object-cover" 
            />
          </div>
          <span className="text-lg font-bold text-foreground">요정</span>
        </Link>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent lg:hidden"
          aria-label="사이드바 닫기"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href !== "#" && pathname.startsWith(item.href)
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
            관
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">관리자</p>
            <p className="text-xs text-muted-foreground truncate">admin@yojeong.kr</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
