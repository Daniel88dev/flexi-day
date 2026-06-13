"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(function FieldInput(
  { label, icon, id, className, ...rest },
  ref
) {
  return (
    <div>
      {label ? (
        <label
          htmlFor={id}
          className="mb-2 block text-[13px] font-semibold tracking-[0.01em]"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        {icon ? (
          <span
            className="pointer-events-none absolute top-1/2 left-[13px] -translate-y-1/2"
            style={{ color: "var(--text-faint)" }}
          >
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          ref={ref}
          className={cn(
            "w-full rounded-[10px] border bg-[var(--surface)] py-3 text-[15px] transition-shadow",
            "outline-none focus:border-[color:var(--primary)] focus:shadow-[0_0_0_4px_var(--ring)]",
            "placeholder:text-[color:var(--text-faint)]",
            className
          )}
          style={{
            borderColor: "var(--border-strong)",
            color: "var(--text)",
            paddingLeft: icon ? 42 : 15,
            paddingRight: 15,
          }}
          {...rest}
        />
      </div>
    </div>
  );
});
