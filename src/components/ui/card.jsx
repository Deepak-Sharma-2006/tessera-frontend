import { forwardRef } from 'react'
import { cn } from '@/lib/utils.js'

const Card = forwardRef(
  ({ className, variant = 'glass', hover = true, interactive = false, glow = false, tilt = false, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          // Base styles with professional polish
          'rounded-lg border transition-all duration-500 relative overflow-hidden group',
          
          // Variants with glassmorphism
          {
            // Default - Clean card
            'bg-card text-card-foreground border-border shadow-soft': variant === 'default',
            
            // Elevated - Higher shadow
            'bg-card text-card-foreground border-border shadow-large': variant === 'elevated',
            
            // Outlined - Emphasis on border
            'bg-card text-card-foreground border border-border shadow-soft': variant === 'outlined',
            
            // Glass - Professional glassmorphism
            'backdrop-blur-xl bg-white/8 text-card-foreground border border-white/15 shadow-md': variant === 'glass',
            
            // Gradient - Subtle gradient background
            'bg-gradient-to-br from-white/15 via-white/10 to-white/8 text-card-foreground border border-white/15 backdrop-blur-xl shadow-sm': variant === 'gradient',
            
            // Neon - Cyber theme with sober glow
            'backdrop-blur-xl bg-cyan-400/5 text-card-foreground border border-cyan-400/20 shadow-sm cyber:shadow-glow': variant === 'neon',
            
            // Floating - Card that appears to float
            'backdrop-blur-xl bg-white/10 text-card-foreground border border-white/20 shadow-lg': variant === 'floating',
          },
          
          // Hover effects - subtle for professional feel
          hover && !interactive && 'hover:shadow-lg hover:border-white/25 hover:-translate-y-1 hover:bg-white/12',
          
          // Interactive effects (for clickable cards)
          interactive && 'cursor-pointer hover:shadow-lg hover:-translate-y-2 hover:bg-white/15 press-effect',
          
          // Glow effect - desaturated
          glow && 'shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25',
          
          // Tilt effect
          tilt && 'tilt-hover',
          
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Top border highlight with subtle animation */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>
        
        {/* Subtle shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-900 ease-out"></div>
        
        {/* Background pattern for special variants */}
        {variant === 'glass' && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-white/3 pointer-events-none"></div>
        )}
        
        {variant === 'neon' && (
          <>
            {/* Subtle cyber grid pattern */}
            <div className="absolute inset-0 opacity-3">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(0,228,228,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,228,228,0.1) 1px, transparent 1px)',
                backgroundSize: '25px 25px'
              }}></div>
            </div>
            {/* Subtle floating particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-0.5 bg-cyan-300/50 rounded-full opacity-30"
                  style={{
                    left: `${20 + i * 60}%`,
                    top: `${30 + (i % 2) * 40}%`,
                    animationDelay: `${i * 0.6}s`,
                  }}
                />
              ))}
            </div>
          </>
        )}
        
        {variant === 'floating' && (
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 rounded-lg blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 -z-10"></div>
        )}
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)

Card.displayName = 'Card'

const CardHeader = forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-8', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight text-lg text-foreground', className)}
      {...props}
    >
      {children}
    </h3>
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground/80 leading-relaxed', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-8 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-8 pt-0', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }