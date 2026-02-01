import { forwardRef } from 'react'
import React from 'react'
import { cn } from '@/lib/utils.js'
import { useTheme } from '@/lib/theme.js'

const Badge = forwardRef(
  ({ className, variant = 'glass', size = 'default', interactive = false, pulse = false, dot = false, earned = false, level, children, ...props }, ref) => {
    const { theme } = useTheme()

    return (
      <div
        className={cn(
          // Base styles with enhanced animations - professional subtle approach
          'inline-flex items-center font-semibold transition-all duration-500 select-none relative overflow-hidden group',

          // Sizes with better proportions
          {
            'px-3 py-1.5 text-xs rounded-lg': size === 'sm',
            'px-4 py-2 text-sm rounded-lg': size === 'default',
            'px-5 py-2.5 text-base rounded-lg': size === 'lg',
          },

          // Variants with glassmorphism - professional sober aesthetic
          {
            // Default - Solid primary (no gradient)
            'bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-500': variant === 'default',

            // Secondary - Subtle glass with light tint
            'backdrop-blur-xl bg-white/6 border border-white/12 text-foreground hover:bg-white/10 hover:border-white/20 shadow-sm': variant === 'secondary',

            // Destructive - Danger styling with glassmorphism
            'backdrop-blur-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/15 hover:border-red-500/30 shadow-sm': variant === 'destructive',

            // Outline - Glass border only
            'backdrop-blur-xl border border-white/20 bg-white/5 text-foreground hover:bg-white/10 hover:border-white/30 shadow-sm': variant === 'outline',

            // Success - Green glassmorphism
            'backdrop-blur-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/30 shadow-sm': variant === 'success',

            // Warning - Amber glassmorphism
            'backdrop-blur-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/30 shadow-sm': variant === 'warning',

            // Info - Primary glassmorphism
            'backdrop-blur-xl bg-primary/10 border border-primary/20 text-primary dark:text-primary-solid hover:bg-primary/15 hover:border-primary/30 shadow-sm': variant === 'info',

            // Gradient - Subtle gradient approach
            'bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-500': variant === 'gradient',

            // Glass - Primary glassmorphism
            'backdrop-blur-xl bg-white/8 border border-white/15 text-foreground hover:bg-white/12 hover:border-white/25 shadow-sm': variant === 'glass',
          },

          // Neon - Cyber theme with sober saturation (80%) - moved outside object literal
          variant === 'neon' && (theme === 'cyber'
            ? 'backdrop-blur-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-400/15 hover:border-cyan-400/30 shadow-sm'
            : 'backdrop-blur-xl bg-primary/10 border border-primary/20 text-primary-solid hover:bg-primary/15 hover:border-primary/30 shadow-sm'),

          // Interactive styles - subtle hover, no heavy scale
          interactive && 'cursor-pointer hover:-translate-y-1 transition-transform duration-500',

          // Pulse animation
          pulse && 'animate-pulse',

          // Earned badge special effects - subtle glow
          earned && 'shadow-lg',

          className
        )}
        ref={ref}
        {...props}
      >
        {/* Shimmer effect - reduced opacity for professional look */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>

        {/* Level indicator for leveled badges - professional styling */}
        {level && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
            {level}
          </div>
        )}

        {/* Dot indicator with theme-aware styling */}
        {dot && (
          <div className={cn(
            'w-2.5 h-2.5 rounded-full mr-2 relative transition-all duration-500',
            {
              'bg-primary-foreground': variant === 'default',
              'bg-white/40': variant === 'secondary',
              'bg-red-500': variant === 'destructive',
              'bg-white/30': variant === 'outline',
              'bg-emerald-500': variant === 'success',
              'bg-amber-500': variant === 'warning',
              'bg-primary': variant === 'info',
              'bg-amber-300': variant === 'gradient',
              'bg-white/50': variant === 'glass',
              'bg-cyan-400': variant === 'neon' && theme === 'cyber',
              'bg-primary-solid': variant === 'neon' && theme !== 'cyber',
            }
          )}>
            {/* Subtle pulse effect for dot */}
            <div className="absolute inset-0 rounded-full bg-current animate-pulse opacity-40"></div>
          </div>
        )}

        {/* Content with professional styling */}
        <span className="relative z-10 flex items-center space-x-1">
          {children}
        </span>

        {/* Special effects for different variants - subtle for professional look */}
        {variant === 'gradient' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out opacity-0 hover:opacity-40 rounded-lg"></div>
        )}

        {variant === 'neon' && theme === 'cyber' && (
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/15 to-cyan-400/5 rounded-lg blur opacity-0 group-hover:opacity-60 transition-opacity duration-300 -z-10"></div>
        )}

        {earned && (
          <>
            {/* Sparkle effects for earned badges - subtle animation */}
            <div className="absolute -inset-2 pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-amber-400 rounded-full opacity-50 animate-pulse"
                  style={{
                    left: `${15 + i * 20}%`,
                    top: `${15 + (i % 2) * 70}%`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '2.5s'
                  }}
                />
              ))}
            </div>
            {/* Subtle glow effect for earned badges */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-orange-400/10 to-amber-400/10 rounded-lg blur opacity-60 animate-pulse -z-10"></div>
          </>
        )}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

// Enhanced Badge Group with professional spacing
const BadgeGroup = forwardRef(
  ({ className, spacing = 'normal', wrap = true, animated = false, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'inline-flex items-center',
          {
            'gap-2': spacing === 'tight',
            'gap-3': spacing === 'normal',
            'gap-4': spacing === 'loose',
            'flex-wrap': wrap,
            'flex-nowrap': !wrap,
          },
          animated && 'animate-in',
          className
        )}
        ref={ref}
        {...props}
      >
        {animated
          ? React.Children.map(children, (child, index) => (
            <div
              key={index}
              className="animate-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {child}
            </div>
          ))
          : children
        }
      </div>
    )
  }
)

BadgeGroup.displayName = 'BadgeGroup'

// Enhanced Counter Badge with glassmorphism
const CounterBadge = forwardRef(
  ({ count, max = 99, showZero = false, ...props }, ref) => {
    if (count === 0 && !showZero) return null

    const displayCount = count > max ? `${max}+` : count.toString()

    return (
      <Badge
        ref={ref}
        size="sm"
        variant="destructive"
        className="min-w-6 h-6 px-2 py-0 text-xs font-bold rounded-full shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-500"
        pulse={count > 0}
        {...props}
      >
        {displayCount}
      </Badge>
    )
  }
)

CounterBadge.displayName = 'CounterBadge'

// Progress Badge for showing completion status
const ProgressBadge = forwardRef(
  ({ progress, label, className, ...props }, ref) => {
    return (
      <Badge
        ref={ref}
        variant="glass"
        className={cn('px-4 py-2 space-x-2', className)}
        {...props}
      >
        <span className="text-xs font-medium tracking-wide">{label}</span>
        <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground/80">{progress}%</span>
      </Badge>
    )
  }
)

ProgressBadge.displayName = 'ProgressBadge'

export { Badge, BadgeGroup, CounterBadge, ProgressBadge }