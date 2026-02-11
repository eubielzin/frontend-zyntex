import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  trend?: string
  isNegative?: boolean
  icon?: LucideIcon
  description?: string
}

export function StatCard({ title, value, trend, isNegative, icon: Icon, description }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
      </div>
      
      <div className="mt-2 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-[#2A362B]">{value}</h3>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isNegative ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
          }`}>
            {trend}
          </span>
        )}
      </div>
      
      {description && (
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      )}
    </div>
  )
}