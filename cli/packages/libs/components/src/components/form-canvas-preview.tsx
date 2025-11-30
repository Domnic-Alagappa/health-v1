import * as React from "react";
import { cn } from "../lib/utils";
import { Input } from "./input";
import { Label } from "./label";

interface PreviewField {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  groupId?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    required?: boolean;
  };
}

interface PreviewGroup {
  id: string;
  title?: string;
  description?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fields: string[];
}

interface PreviewSection {
  id: string;
  title?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FormCanvasPreviewProps {
  fields: PreviewField[];
  groups: PreviewGroup[];
  sections: PreviewSection[];
  canvasWidth: number;
  canvasHeight: number;
  sheetSize: string;
}

/**
 * Print Preview Component - Shows how the form will look when printed
 */
export function FormCanvasPreview({
  fields,
  groups,
  sections,
  canvasWidth,
  canvasHeight,
  sheetSize,
}: FormCanvasPreviewProps) {
  const [formData, setFormData] = React.useState<Record<string, unknown>>({});

  const handleChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const renderField = (field: PreviewField) => {
    const value = formData[field.id] ?? "";

    // Image/Logo field
    if (field.imageUrl) {
      return (
        <div
          key={field.id}
          className="absolute"
          style={{
            left: `${field.x}px`,
            top: `${field.y}px`,
            width: `${field.width}px`,
            height: `${field.height}px`,
          }}
        >
          <div className="w-full h-full flex items-center justify-center bg-white">
            <img
              src={field.imageUrl}
              alt={field.label || "Image"}
              className="max-w-full max-h-full object-contain"
              style={{ maxWidth: "100%", maxHeight: "100%" }}
            />
          </div>
        </div>
      );
    }

    // Horizontal line
    if (field.lineDirection === "horizontal") {
      return (
        <div
          key={field.id}
          className="absolute"
          style={{
            left: `${field.x}px`,
            top: `${field.y}px`,
            width: `${field.width}px`,
            height: `${field.height}px`,
            borderTop: `${field.borderWidth || 1}px ${field.borderStyle || "solid"} ${field.borderColor || "#1C1C1E"}`,
          }}
        />
      );
    }

    // Vertical line
    if (field.lineDirection === "vertical") {
      return (
        <div
          key={field.id}
          className="absolute"
          style={{
            left: `${field.x}px`,
            top: `${field.y}px`,
            width: `${field.width}px`,
            height: `${field.height}px`,
            borderLeft: `${field.borderWidth || 1}px ${field.borderStyle || "solid"} ${field.borderColor || "#1C1C1E"}`,
          }}
        />
      );
    }

    // Box with border
    if (field.borderStyle && field.borderStyle !== "none") {
      return (
        <div
          key={field.id}
          className="absolute"
          style={{
            left: `${field.x}px`,
            top: `${field.y}px`,
            width: `${field.width}px`,
            height: `${field.height}px`,
            border: `${field.borderWidth || 1}px ${field.borderStyle || "solid"} ${field.borderColor || "#1C1C1E"}`,
            backgroundColor: "transparent",
          }}
        />
      );
    }

    if (field.type === "separator") {
      return (
        <div
          key={field.id}
          className="absolute"
          style={{
            left: `${field.x}px`,
            top: `${field.y}px`,
            width: `${field.width}px`,
            height: `${field.height}px`,
          }}
        >
          <div className="relative w-full h-full flex items-center">
            <div className="w-full border-t-2 border-[#1C1C1E]"></div>
            {field.label && (
              <div className="absolute left-1/2 -translate-x-1/2 bg-white px-2">
                <span className="text-xs text-[#1C1C1E]">{field.label}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (field.type === "display-text") {
      return (
        <div
          key={field.id}
          className="absolute"
          style={{
            left: `${field.x}px`,
            top: `${field.y}px`,
            width: `${field.width}px`,
            height: `${field.height}px`,
          }}
        >
          <h3 className="text-base font-semibold text-[#1C1C1E]">{field.label}</h3>
        </div>
      );
    }

    return (
      <div
        key={field.id}
        className="absolute"
        style={{
          left: `${field.x}px`,
          top: `${field.y}px`,
          width: `${field.width}px`,
          height: `${field.height}px`,
        }}
      >
        <div className="space-y-1">
          {field.label && (
            <Label htmlFor={field.id} className="text-xs font-medium text-[#1C1C1E]">
              {field.label}
              {field.validation?.required && <span className="text-[#D6461F] ml-1">*</span>}
            </Label>
          )}
          {field.type === "textarea" ? (
            <textarea
              id={field.id}
              name={field.name}
              value={String(value)}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="w-full h-full min-h-[60px] border border-[#1C1C1E] rounded-xs px-2 py-1 text-sm text-[#1C1C1E] bg-white"
              style={{ height: `${field.height - 20}px` }}
            />
          ) : field.type === "select" ? (
            <select
              id={field.id}
              name={field.name}
              value={String(value)}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className="w-full border border-[#1C1C1E] rounded-xs px-2 py-1 text-sm text-[#1C1C1E] bg-white"
              style={{ height: `${field.height - 20}px` }}
            >
              {field.placeholder && <option value="">{field.placeholder}</option>}
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === "checkbox" ? (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={field.id}
                name={field.name}
                checked={Boolean(value)}
                onChange={(e) => handleChange(field.id, e.target.checked)}
                className="h-4 w-4 border border-[#1C1C1E]"
              />
              <Label htmlFor={field.id} className="text-xs text-[#1C1C1E]">
                {field.label}
              </Label>
            </div>
          ) : field.type === "radio" && field.options ? (
            <div className="space-y-1">
              {field.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${field.id}-${option.value}`}
                    name={field.name}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className="h-4 w-4 border border-[#1C1C1E]"
                  />
                  <Label htmlFor={`${field.id}-${option.value}`} className="text-xs text-[#1C1C1E]">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <Input
              id={field.id}
              name={field.name}
              type={field.type}
              value={String(value)}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="border border-[#1C1C1E] rounded-xs px-2 py-1 text-sm text-[#1C1C1E] bg-white"
              style={{ height: `${field.height - 20}px` }}
            />
          )}
        </div>
      </div>
    );
  };

  // Add print styles to document head
  React.useEffect(() => {
    const styleId = "form-canvas-print-styles";
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const printStyles = `
      @media print {
        /* Hide everything by default */
        body * {
          visibility: hidden !important;
        }
        
        /* Show only the print canvas */
        .print-canvas-only,
        .print-canvas-only * {
          visibility: visible !important;
        }
        
        .print-canvas-only {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .print-canvas-content {
          width: ${canvasWidth}px !important;
          height: ${canvasHeight}px !important;
          margin: 0 auto !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
          background: white !important;
        }
        
        /* Hide all UI elements */
        .print-header,
        .print-instructions,
        nav,
        aside,
        header,
        footer,
        button:not(.print-canvas-only button),
        .no-print {
          display: none !important;
          visibility: hidden !important;
        }
        
        @page {
          margin: 0 !important;
          size: ${sheetSize === "a4" ? "A4" : sheetSize === "letter" ? "letter" : sheetSize === "legal" ? "legal" : sheetSize === "a3" ? "A3" : sheetSize === "a5" ? "A5" : "auto"};
        }
        
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
      }
    `;

    styleElement.textContent = printStyles;

    return () => {
      // Cleanup on unmount
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [canvasWidth, canvasHeight, sheetSize]);

  return (
    <>
      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        <div className="mx-auto" style={{ maxWidth: `${canvasWidth + 100}px` }}>
          {/* Print Preview Header */}
          <div className="print-header mb-4 p-4 bg-white rounded-md shadow-sm border border-[#E1E4E8]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Print Preview</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Sheet Size: {sheetSize.toUpperCase()} ({canvasWidth} × {canvasHeight} px)
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90"
              >
                Print
              </button>
            </div>
          </div>

          {/* Print Preview Canvas - Wrapper for print */}
          <div className="print-canvas-only">
            <div
              className="print-canvas-content relative bg-white"
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                minHeight: `${canvasHeight}px`,
              }}
            >
              {/* Sections */}
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="absolute border-b-2 border-[#1C1C1E] bg-gray-50"
                  style={{
                    left: `${section.x}px`,
                    top: `${section.y}px`,
                    width: `${section.width}px`,
                    height: `${section.height}px`,
                  }}
                >
                  <div className="p-4">
                    <h2 className="text-lg font-bold text-[#1C1C1E]">
                      {section.title || "Section"}
                    </h2>
                  </div>
                </div>
              ))}

              {/* Groups */}
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="absolute border border-[#1C1C1E] bg-white"
                  style={{
                    left: `${group.x}px`,
                    top: `${group.y}px`,
                    width: `${group.width}px`,
                    height: `${group.height}px`,
                  }}
                >
                  {group.title && (
                    <div className="border-b border-[#1C1C1E] p-2 bg-gray-50">
                      <h4 className="text-sm font-semibold text-[#1C1C1E]">{group.title}</h4>
                      {group.description && (
                        <p className="text-xs text-[#4A4A4E] mt-1">{group.description}</p>
                      )}
                    </div>
                  )}
                  <div className="p-2">
                    {group.fields.map((fieldId) => {
                      const field = fields.find((f) => f.id === fieldId);
                      if (!field) return null;
                      // Adjust field position relative to group
                      const relativeField = {
                        ...field,
                        x: field.x - group.x,
                        y: field.y - group.y - (group.title ? 40 : 0),
                      };
                      return renderField(relativeField);
                    })}
                  </div>
                </div>
              ))}

              {/* Fields (not in groups) */}
              {fields.filter((field) => !field.groupId).map(renderField)}
            </div>
          </div>

          {/* Print Instructions */}
          <div className="print-instructions mt-4 p-4 bg-white rounded-md shadow-sm border border-[#E1E4E8]">
            <p className="text-xs text-muted-foreground">
              💡 Tip: Use your browser's print dialog (Ctrl/Cmd + P) to print or save as PDF. The
              preview shows exactly how the form will appear on paper.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
