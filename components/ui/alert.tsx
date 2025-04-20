"use client"

import React from "react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}

export function Alert({ variant = "default", className = "", children, ...props }: AlertProps) {
  const baseStyles = "p-4 border rounded-md flex items-start gap-2"
  const variantStyles =
    variant === "destructive"
      ? "bg-red-50 border-red-200 text-red-800"
      : "bg-green-50 border-green-200 text-green-800"

  return (
    <div className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </div>
  )
}

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export function AlertTitle({ className = "", children, ...props }: TitleProps) {
  return (
    <h5 className={`font-medium leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h5>
  )
}

interface DescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export function AlertDescription({ className = "", children, ...props }: DescriptionProps) {
  return (
    <p className={`text-sm ${className}`} {...props}>
      {children}
    </p>
  )
}
