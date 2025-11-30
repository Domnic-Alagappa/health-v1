import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Flex } from "@/components/ui/flex";
import type { FormBuilderProps, FormField } from "@/components/ui/form-builder";
import { Label } from "@/components/ui/label";
import { Stack } from "@/components/ui/stack";
import { useFormBuilder } from "@/hooks/forms/useFormBuilder";
import {
  getAlignmentClasses,
  getFieldSizeClasses,
  getGapClasses,
  getGridColSpan,
  getGridLayoutClasses,
  getMarginClasses,
  getPaddingClasses,
  getWidthClasses,
} from "@/lib/formLayoutUtils";
import { cn } from "@/lib/utils";
import { FormFieldGroupComponent } from "./FormFieldGroup";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { FormFieldSection } from "./FormFieldSection";

export function FormBuilder({
  config,
  onSubmit,
  onCancel,
  initialValues = {},
  className,
}: FormBuilderProps) {
  const {
    formData,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validateForm,
    isFieldVisible,
    sortedFields,
  } = useFormBuilder({ config, initialValues });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    if (!isFieldVisible(field)) return null;

    const value = formData[field.id] ?? field.defaultValue ?? "";
    const error = errors[field.id];
    const hasError = touched[field.id] && error;
    const layout = field.layout || {};

    if (field.type === "separator" || field.type === "display-text") {
      return <FormFieldSection key={field.id} field={field} />;
    }

    const fieldContainerClasses = cn(
      "space-y-2",
      getGridColSpan(layout.colSpan),
      getMarginClasses(layout.margin),
      getPaddingClasses(layout.padding),
      getAlignmentClasses(layout.alignment),
      layout.order && `order-${layout.order}`
    );

    return (
      <Stack
        key={field.id}
        spacing="xs"
        className={fieldContainerClasses}
        style={layout.order ? { order: layout.order } : undefined}
      >
        {field.label && (
          <Label htmlFor={field.id} help={field.help}>
            {field.label}
            {field.validation?.required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </Label>
        )}
        {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}

        <FormFieldRenderer
          field={field}
          value={value}
          hasError={hasError}
          layout={layout}
          onChange={(value) => handleChange(field.id, value)}
          onBlur={() => handleBlur(field.id)}
          getFieldSizeClasses={getFieldSizeClasses}
          getWidthClasses={getWidthClasses}
        />

        {hasError && (
          <p id={`${field.id}-error`} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </Stack>
    );
  };

  const renderFieldsWithGroups = () => {
    if (config.groups && config.groups.length > 0) {
      return config.groups.map((group) => {
        const groupFields = sortedFields.filter((f) => f.groupId === group.id);
        if (groupFields.length === 0) return null;

        return (
          <FormFieldGroupComponent
            key={group.id}
            group={group}
            fields={groupFields.map((field) => ({ field, render: () => renderField(field) }))}
            getGridLayoutClasses={() => getGridLayoutClasses(config)}
            getGapClasses={() => getGapClasses(config)}
          />
        );
      });
    }
    return sortedFields.map(renderField);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("overflow-auto", className)} noValidate>
      <Stack spacing="lg">
        {(config.title || config.description) && (
          <Stack spacing="xs">
            {config.title && <h2 className="text-2xl font-semibold">{config.title}</h2>}
            {config.description && (
              <p className="text-sm text-muted-foreground">{config.description}</p>
            )}
          </Stack>
        )}

        <Box
          className={cn(
            "grid",
            getGridLayoutClasses(config),
            getGapClasses(config),
            "auto-rows-min"
          )}
        >
          {renderFieldsWithGroups()}
        </Box>

        <Flex className="items-center justify-end gap-3 pt-4 border-t">
          {config.showCancel && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {config.cancelLabel || "Cancel"}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : config.submitLabel || "Submit"}
          </Button>
        </Flex>
      </Stack>
    </form>
  );
}
