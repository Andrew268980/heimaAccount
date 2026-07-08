import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm':
              variant === 'default',
            'border border-slate-300 bg-white hover:bg-slate-50':
              variant === 'outline',
            'hover:bg-slate-100': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600': variant === 'destructive',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'default',
            'h-12 px-6 text-base': size === 'lg',
          },
          className,
        )}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
export { Button }
