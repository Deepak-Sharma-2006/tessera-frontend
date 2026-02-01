import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles with professional polish
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group press-effect hover-lift tracking-wide',
  {
    variants: {
      variant: {
        // High-Gloss Primary - Solid fills with subtle gradient
        default: 'bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:shadow-primary/25 hover:scale-103 cyber:shadow-glow cyber:hover:shadow-xl',
        
        // Elegant Gradient - Luxury feel with sober colors
        gradient: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:shadow-purple-500/25 hover:scale-103',
        
        // Ghost Button - Border only, minimal
        ghost: 'border border-white/20 text-foreground hover:bg-white/8 hover:border-white/40 hover:shadow-sm transition-colors',
        
        // Glass - Subtle glassmorphism
        glass: 'backdrop-blur-xl border border-white/15 bg-white/8 text-foreground hover:bg-white/15 hover:border-white/30 hover:shadow-md',
        
        // Sober Neon - Desaturated neon with internal glow
        neon: 'border border-cyan-400/40 bg-cyan-400/5 text-cyan-300 hover:bg-cyan-400/10 hover:border-cyan-400/60 shadow-md shadow-cyan-400/10 cyber:hover:shadow-glow',
        
        // Destructive
        destructive: 'bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/20',
        
        // Outline - Professional border style
        outline: 'border-2 border-foreground/20 text-foreground hover:border-foreground/40 hover:bg-white/5 hover:shadow-sm',
        
        // Secondary - Muted variant
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm',
        
        // Link - Text only
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary/80',
      },
      size: {
        sm: 'h-9 px-4 py-1 text-sm',
        default: 'h-11 px-8 py-2 text-sm',
        lg: 'h-13 px-10 py-3 text-base',
        xl: 'h-15 px-12 py-4 text-lg',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, loading = false, glow = false, children, type = 'button', ...props }, ref) => {
  if (asChild) {
    return (
      <Slot
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={type}
        {...props}
      >
        {children}
      </Slot>
    )
  }

  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }), {
        'shadow-glow hover:shadow-xl hover:shadow-primary/60 animate-pulse': glow,
        'cursor-not-allowed opacity-70': loading,
      })}
      ref={ref}
      disabled={loading || props.disabled}
      {...props}
    >
      {/* Enhanced shine effect for primary buttons */}
      {(variant === 'default' || variant === 'gradient') && (
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
        </div>
      )}

      {/* Glass shimmer effect */}
      {(variant === 'glass' || variant === 'outline' || variant === 'secondary') && (
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-800 ease-out"></div>
        </div>
      )}

      {/* Ripple effect container */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-white/5 scale-0 group-active:scale-100 transition-transform duration-300 rounded-full origin-center"></div>
      </div>

      {/* Floating particles for neon variant - subdued */}
      {variant === 'neon' && (
        <div className="absolute -inset-1 pointer-events-none">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-cyan-300/60 rounded-full opacity-40"
              style={{
                left: `${30 + i * 40}%`,
                top: `${15 + (i % 2) * 70}%`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content with enhanced loading state */}
      <div className="relative flex items-center space-x-2 z-10">
        {loading && (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin">
            <div className="absolute inset-0 border-2 border-transparent border-t-current/40 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
          </div>
        )}
        {children}
      </div>

      {/* Level up effect for special interactions */}
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-red-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
      )}
    </button>
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }