import BottomNav from '@/components/layout/BottomNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="page-content">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
