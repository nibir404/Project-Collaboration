import { clsx } from 'clsx'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          )}
          {trend && (
            <div className={clsx(
              'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className="rounded-xl bg-primary-50 p-3 text-primary-600 group-hover:bg-primary-100 transition-colors">
          {icon}
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
