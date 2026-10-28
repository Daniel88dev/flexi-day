"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input, inputClassName } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type FrameProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string | null;
  /** Shows a Clear button that sets the value to "". */
  clearable?: boolean;
};

type ValueProps = {
  value: string;
  onChange: (value: string) => void;
};

export function Field({
  id,
  label,
  hint,
  error,
  onClear,
  children,
}: Omit<FrameProps, "clearable"> & { onClear?: () => void; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {onClear ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`${t.directory.edit.clear}: ${label}`}
          onClick={onClear}
        >
          {t.directory.edit.clear}
        </Button>
      ) : null}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  hint,
  error,
  clearable,
  onChange,
  ...input
}: FrameProps & ValueProps & Omit<ComponentProps<"input">, "id" | "value" | "onChange">) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      onClear={clearable ? () => onChange("") : undefined}
    >
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        {...input}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

type SelectProps = ValueProps & Omit<ComponentProps<"select">, "value" | "onChange">;
type LabelledSelectProps = SelectProps & FrameProps;
type SelectFieldProps =
  | LabelledSelectProps
  | (SelectProps & {
      label?: undefined;
      hint?: undefined;
      error?: undefined;
      clearable?: undefined;
    });

const isLabelled = (props: SelectFieldProps): props is LabelledSelectProps =>
  props.label !== undefined;

/**
 * The native select, styled like `Input`. With a `label` it renders inside a `Field`;
 * without one it is the bare control and needs an `aria-label`.
 */
export function SelectField(props: SelectFieldProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keeps label off the <select>
  const { label, hint, error, clearable, onChange, className, ...select } = props;
  const control = (
    <select
      {...select}
      onChange={(event) => onChange(event.target.value)}
      className={cn(inputClassName, className)}
    />
  );
  if (!isLabelled(props)) return control;
  return (
    <Field
      id={props.id}
      label={props.label}
      hint={hint}
      error={error}
      onClear={clearable ? () => onChange("") : undefined}
    >
      {control}
    </Field>
  );
}
