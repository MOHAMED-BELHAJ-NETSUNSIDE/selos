"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full bg-primary transition-all duration-500 ease-in-out",
          value === undefined && "animate-pulse"
        )}
        style={{ 
          width: value !== undefined ? `${value}%` : '100%',
          transform: value !== undefined ? `translateX(0)` : undefined
        }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }

