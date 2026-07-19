"use client"

import { forwardRef } from "react"
import { ChevronDown, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SelectOption } from "@/types"

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  helperText?: string
  wrapperClassName?: string
  onChange?: (value: string) => void
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      options,
      placeholder,
      error,
      helperText,
      wrapperClassName,
      disabled,
      id,
      onChange,
      value,
      ...props
    },
    ref,
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className={cn("w-full", wrapperClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-content-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              "block w-full appearance-none rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm text-content-primary",
              "transition-colors duration-150",
              "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-secondary",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              !error && "border-border-primary",
              !value && "text-content-secondary",
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-content-muted">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert">
            <AlertCircle size={12} />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-xs text-content-secondary">
            {helperText}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = "Select"
