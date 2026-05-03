import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function FormField({ label, optional, children, className }: {
  label: string
  optional?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <Label className="mb-1.5 text-sm font-medium text-[#14181f]">
        {label}
        {optional && <span className="ml-1 text-[#929eaa] font-normal">(isteğe bağlı)</span>}
      </Label>
      {children}
    </div>
  )
}
