import { Flex } from "@/components/ui/flex";
import type { FieldLayout, FormField } from "@/components/ui/form-builder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stack } from "@/components/ui/stack";
import { cn } from "@/lib/utils";

interface FormFieldRendererProps {
  field: FormField;
  value: unknown;
  hasError: boolean;
  layout: FieldLayout;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  getFieldSizeClasses: (size?: FieldLayout["size"]) => string;
  getWidthClasses: (width?: FieldLayout["width"]) => string;
}

export function FormFieldRenderer({
  field,
  value,
  hasError,
  layout,
  onChange,
  onBlur,
  getFieldSizeClasses,
  getWidthClasses,
}: FormFieldRendererProps) {
  const baseInputProps = {
    id: field.id,
    name: field.name || field.id,
    value: value as string | number,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      onChange(e.target.value);
    },
    onBlur,
    disabled: field.disabled,
    readOnly: field.readonly,
    "aria-invalid": hasError,
    "aria-describedby": hasError ? `${field.id}-error` : undefined,
    className: cn(
      field.className,
      hasError && "border-destructive",
      getFieldSizeClasses(layout.size),
      getWidthClasses(layout.width),
      "px-4"
    ),
  };

  if (field.type === "textarea") {
    return (
      <textarea
        {...baseInputProps}
        rows={layout.size === "sm" ? 3 : layout.size === "lg" ? 6 : layout.size === "xl" ? 8 : 4}
        placeholder={field.placeholder}
        className={cn(
          "flex w-full rounded-xs border border-[#E1E4E8] bg-background px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary hover:border-[#D0D6DB] transition-fluent disabled:cursor-not-allowed disabled:opacity-50",
          hasError && "border-destructive",
          getFieldSizeClasses(layout.size),
          getWidthClasses(layout.width),
          layout.size === "sm"
            ? "min-h-[60px]"
            : layout.size === "lg"
              ? "min-h-[120px]"
              : layout.size === "xl"
                ? "min-h-[160px]"
                : "min-h-[80px]",
          field.className
        )}
      />
    );
  }

  if (field.type === "select" || field.type === "multiselect") {
    return (
      <select
        {...(baseInputProps as React.SelectHTMLAttributes<HTMLSelectElement>)}
        multiple={field.type === "multiselect"}
        className={cn(
          "flex w-full rounded-xs border border-[#E1E4E8] bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary hover:border-[#D0D6DB] transition-fluent disabled:cursor-not-allowed disabled:opacity-50",
          hasError && "border-destructive",
          getFieldSizeClasses(layout.size),
          getWidthClasses(layout.width),
          field.className
        )}
      >
        {field.placeholder && <option value="">{field.placeholder}</option>}
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <Flex className={cn("items-center gap-2", getWidthClasses(layout.width))}>
        <input
          type="checkbox"
          id={field.id}
          name={field.name || field.id}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          disabled={field.disabled}
          className={cn(
            "rounded-xs border border-[#E1E4E8] text-primary focus:ring-2 focus:ring-ring transition-fluent",
            layout.size === "sm" ? "h-3.5 w-3.5" : layout.size === "lg" ? "h-5 w-5" : "h-4 w-4"
          )}
        />
        <Label htmlFor={field.id} className="font-normal">
          {field.description || field.label}
        </Label>
      </Flex>
    );
  }

  if (field.type === "radio" && field.options) {
    return (
      <Stack spacing="xs" className={getWidthClasses(layout.width)}>
        {field.options.map((option) => (
          <Flex key={option.value} className="items-center gap-2">
            <input
              type="radio"
              id={`${field.id}-${option.value}`}
              name={field.name || field.id}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              disabled={field.disabled}
              className={cn(
                "border border-[#E1E4E8] text-primary focus:ring-2 focus:ring-ring transition-fluent",
                layout.size === "sm" ? "h-3.5 w-3.5" : layout.size === "lg" ? "h-5 w-5" : "h-4 w-4"
              )}
            />
            <Label htmlFor={`${field.id}-${option.value}`} className="font-normal">
              {option.label}
            </Label>
          </Flex>
        ))}
      </Stack>
    );
  }

  return (
    <Input
      {...baseInputProps}
      type={field.type}
      placeholder={field.placeholder}
      help={field.help}
      className={cn(
        baseInputProps.className,
        getFieldSizeClasses(layout.size),
        getWidthClasses(layout.width)
      )}
    />
  );
}
