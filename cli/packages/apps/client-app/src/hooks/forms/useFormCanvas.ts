import type {
  CanvasField,
  CanvasFormConfig,
  CanvasGroup,
  CanvasSection,
} from "@/components/forms/canvas/types";
import { useRef, useState } from "react";

export function useFormCanvas() {
  const [fields, setFields] = useState<CanvasField[]>([]);
  const [groups, setGroups] = useState<CanvasGroup[]>([]);
  const [sections, setSections] = useState<CanvasSection[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [canvasConfig, setCanvasConfig] = useState<CanvasFormConfig>({
    id: "canvas-form-1",
    title: "Visual Form",
    canvasWidth: 1200,
    canvasHeight: 1600,
    snapToGrid: true,
    gridSize: 10,
    layout: "single",
  });
  const canvasRef = useRef<HTMLDivElement>(null);

  const updateField = (fieldId: string, updates: Partial<CanvasField>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const removeGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      setFields(fields.map((f) => (f.groupId === groupId ? { ...f, groupId: undefined } : f)));
    }
    setGroups(groups.filter((g) => g.id !== groupId));
    if (selectedGroup === groupId) {
      setSelectedGroup(null);
    }
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  };

  return {
    fields,
    setFields,
    groups,
    setGroups,
    sections,
    setSections,
    selectedField,
    setSelectedField,
    selectedGroup,
    setSelectedGroup,
    selectedSection,
    setSelectedSection,
    canvasConfig,
    setCanvasConfig,
    canvasRef,
    updateField,
    removeField,
    removeGroup,
    removeSection,
  };
}
