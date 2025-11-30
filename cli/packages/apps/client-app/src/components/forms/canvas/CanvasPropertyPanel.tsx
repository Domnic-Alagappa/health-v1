import { Trash2 } from "lucide-react"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Stack } from "@/components/ui/stack"
import type { CanvasField, CanvasGroup, CanvasSection } from "./types"

interface CanvasPropertyPanelProps {
  selectedField: CanvasField | null
  selectedGroup: CanvasGroup | null
  selectedSection: CanvasSection | null
  snap: (value: number) => number
  onUpdateField: (fieldId: string, updates: Partial<CanvasField>) => void
  onUpdateGroup: (groupId: string, updates: Partial<CanvasGroup>) => void
  onUpdateSection: (sectionId: string, updates: Partial<CanvasSection>) => void
  onRemoveField: (fieldId: string) => void
  onRemoveGroup: (groupId: string) => void
  onRemoveSection: (sectionId: string) => void
}

export function CanvasPropertyPanel({
  selectedField,
  selectedGroup,
  selectedSection,
  snap,
  onUpdateField,
  onUpdateGroup,
  onUpdateSection,
  onRemoveField,
  onRemoveGroup,
  onRemoveSection,
}: CanvasPropertyPanelProps) {
  if (!selectedField && !selectedGroup && !selectedSection) return null

  return (
    <Box className="w-80 border-l bg-white">
      {selectedField && (
        <>
          <h3 className="text-sm font-semibold mb-4">Field Properties</h3>
          <Stack spacing="md">
            <Stack spacing="xs">
              <Label htmlFor="field-label" className="text-xs">
                Label
              </Label>
              <Input
                id="field-label"
                value={selectedField.label}
                onChange={(e) => onUpdateField(selectedField.id, { label: e.target.value })}
                className="h-8 text-sm"
              />
            </Stack>
            <Stack spacing="xs">
              <Label htmlFor="field-name" className="text-xs">
                Name
              </Label>
              <Input
                id="field-name"
                value={selectedField.name}
                onChange={(e) => onUpdateField(selectedField.id, { name: e.target.value })}
                className="h-8 text-sm"
              />
            </Stack>
            {selectedField.imageUrl !== undefined && (
              <Stack spacing="xs">
                <Label htmlFor="field-image-url" className="text-xs">
                  Image URL
                </Label>
                <Input
                  id="field-image-url"
                  type="url"
                  value={selectedField.imageUrl || ""}
                  onChange={(e) => onUpdateField(selectedField.id, { imageUrl: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="https://example.com/logo.png"
                />
              </Stack>
            )}
            <Box className="pt-4 border-t">
              <h4 className="text-xs font-semibold mb-3">Position & Size</h4>
              <Box className="grid grid-cols-2 gap-2">
                <Stack spacing="xs">
                  <Label htmlFor="field-x" className="text-xs">
                    X
                  </Label>
                  <Input
                    id="field-x"
                    type="number"
                    value={selectedField.x}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, { x: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </Stack>
                <Stack spacing="xs">
                  <Label htmlFor="field-y" className="text-xs">
                    Y
                  </Label>
                  <Input
                    id="field-y"
                    type="number"
                    value={selectedField.y}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, { y: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </Stack>
                <Stack spacing="xs">
                  <Label htmlFor="field-width" className="text-xs">
                    Width
                  </Label>
                  <Input
                    id="field-width"
                    type="number"
                    value={selectedField.width}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, { width: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </Stack>
                <Stack spacing="xs">
                  <Label htmlFor="field-height" className="text-xs">
                    Height
                  </Label>
                  <Input
                    id="field-height"
                    type="number"
                    value={selectedField.height}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, { height: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </Stack>
              </Box>
            </Box>
            <Box className="pt-4 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveField(selectedField.id)}
                className="w-full"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete Field
              </Button>
            </Box>
          </Stack>
        </>
      )}

      {selectedGroup && (
        <>
          <h3 className="text-sm font-semibold mb-4">Group Properties</h3>
          <Stack spacing="md">
            <Stack spacing="xs">
              <Label htmlFor="group-title" className="text-xs">
                Title
              </Label>
              <Input
                id="group-title"
                value={selectedGroup.title || ""}
                onChange={(e) => onUpdateGroup(selectedGroup.id, { title: e.target.value })}
                className="h-8 text-sm"
              />
            </Stack>
            <Box className="pt-4 border-t">
              <h4 className="text-xs font-semibold mb-3">Position & Size</h4>
              <Box className="grid grid-cols-2 gap-2">
                <Stack spacing="xs">
                  <Label htmlFor="group-x" className="text-xs">
                    X
                  </Label>
                  <Input
                    id="group-x"
                    type="number"
                    value={selectedGroup.x}
                    onChange={(e) =>
                      onUpdateGroup(selectedGroup.id, { x: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </Stack>
                <Stack spacing="xs">
                  <Label htmlFor="group-y" className="text-xs">
                    Y
                  </Label>
                  <Input
                    id="group-y"
                    type="number"
                    value={selectedGroup.y}
                    onChange={(e) =>
                      onUpdateGroup(selectedGroup.id, { y: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </Stack>
                <Stack spacing="xs">
                  <Label htmlFor="group-width" className="text-xs">
                    Width
                  </Label>
                  <Input
                    id="group-width"
                    type="number"
                    value={selectedGroup.width}
                    onChange={(e) =>
                      onUpdateGroup(selectedGroup.id, { width: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </Stack>
                <Stack spacing="xs">
                  <Label htmlFor="group-height" className="text-xs">
                    Height
                  </Label>
                  <Input
                    id="group-height"
                    type="number"
                    value={selectedGroup.height}
                    onChange={(e) =>
                      onUpdateGroup(selectedGroup.id, { height: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </Stack>
              </Box>
            </Box>
            <Box className="pt-4 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveGroup(selectedGroup.id)}
                className="w-full"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete Group
              </Button>
            </Box>
          </Stack>
        </>
      )}

      {selectedSection && (
        <>
          <h3 className="text-sm font-semibold mb-4">Section Properties</h3>
          <Stack spacing="md">
            <Stack spacing="xs">
              <Label htmlFor="section-title" className="text-xs">
                Title
              </Label>
              <Input
                id="section-title"
                value={selectedSection.title || ""}
                onChange={(e) => onUpdateSection(selectedSection.id, { title: e.target.value })}
                className="h-8 text-sm"
              />
            </Stack>
            <Box className="pt-4 border-t">
              <h4 className="text-xs font-semibold mb-3">Position & Size</h4>
              <Box className="grid grid-cols-2 gap-2">
                <Stack spacing="xs">
                  <Label htmlFor="section-x" className="text-xs">
                    X
                  </Label>
                  <Input
                    id="section-x"
                    type="number"
                    value={selectedSection.x}
                    onChange={(e) =>
                      onUpdateSection(selectedSection.id, { x: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </Stack>
                <Stack spacing="xs">
                  <Label htmlFor="section-y" className="text-xs">
                    Y
                  </Label>
                  <Input
                    id="section-y"
                    type="number"
                    value={selectedSection.y}
                    onChange={(e) =>
                      onUpdateSection(selectedSection.id, { y: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </Stack>
              </Box>
            </Box>
            <Box className="pt-4 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveSection(selectedSection.id)}
                className="w-full"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete Section
              </Button>
            </Box>
          </Stack>
        </>
      )}
    </Box>
  )
}
