import DashboardLayout from '../../components/DashboardLayout'
import ProtectedRoute from '../../components/ProtectedRoute'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F5F5F7] transition-colors duration-300 dark:bg-slate-950">
        <DashboardLayout />
      </div>
    </ProtectedRoute>
  )
}