/**
 * UI Entity Registration Page
 * Register and manage pages, buttons, fields, and API endpoints
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@health-v1/ui-components";
import { Plus, Search, FileText, Globe } from "lucide-react";
import { ProtectedPage, ProtectedButton } from "../lib/permissions";
import {
  listPages,
  listButtonsForPage,
  listFieldsForPage,
  listApis,
  type UiPage,
} from "../lib/api/ui-entities";
import { RegisterPageForm } from "../components/ui-entities/RegisterPageForm";
import { RegisterButtonForm } from "../components/ui-entities/RegisterButtonForm";
import { RegisterFieldForm } from "../components/ui-entities/RegisterFieldForm";
import { RegisterApiForm } from "../components/ui-entities/RegisterApiForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@health-v1/ui-components";

export function UiEntitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pages" | "buttons" | "fields" | "apis">("pages");
  const [showPageForm, setShowPageForm] = useState(false);
  const [showButtonForm, setShowButtonForm] = useState(false);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [showApiForm, setShowApiForm] = useState(false);
  const [selectedPageId] = useState<string>("");

  const { data: pagesResponse, isLoading: isLoadingPages } = useQuery({
    queryKey: ["uiPages"],
    queryFn: listPages,
  });

  const pages = pagesResponse?.data?.pages || [];

  const { data: apisResponse, isLoading: isLoadingApis } = useQuery({
    queryKey: ["uiApis"],
    queryFn: listApis,
  });

  const apis = apisResponse?.data?.apis || [];

  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApis = apis.filter((api) =>
    api.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    api.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedPage pageName="ui-entities" fallback={<div className="p-6">You don't have access to this page.</div>}>
      <div className="p-6">
        <Stack spacing="lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">UI Entities</h1>
              <p className="text-muted-foreground">Register and manage UI components for access control</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="apis">APIs</TabsTrigger>
            </TabsList>

            <TabsContent value="pages">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Registered Pages</CardTitle>
                      <CardDescription>Pages registered for access control</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search pages..."
                          className="pl-8 w-64"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <ProtectedButton buttonId="register-page" onClick={() => setShowPageForm(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Register Page
                      </ProtectedButton>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingPages ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">Loading pages...</p>
                    </div>
                  ) : filteredPages.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-center">
                      <div className="space-y-2">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No pages registered</p>
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Path</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Zanzibar Resource</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPages.map((page) => (
                          <TableRow key={page.id}>
                            <TableCell className="font-medium">{page.name}</TableCell>
                            <TableCell className="font-mono text-sm">{page.path}</TableCell>
                            <TableCell>{page.description || "-"}</TableCell>
                            <TableCell className="font-mono text-xs">{page.zanzibar_resource}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="buttons">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Registered Buttons</CardTitle>
                      <CardDescription>Buttons registered for access control</CardDescription>
                    </div>
                    <ProtectedButton buttonId="register-button" onClick={() => setShowButtonForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Register Button
                    </ProtectedButton>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pages.map((page) => (
                      <PageButtonsSection key={page.id} page={page} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fields">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Registered Fields</CardTitle>
                      <CardDescription>Form fields registered for access control</CardDescription>
                    </div>
                    <ProtectedButton buttonId="register-field" onClick={() => setShowFieldForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Register Field
                    </ProtectedButton>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pages.map((page) => (
                      <PageFieldsSection key={page.id} page={page} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="apis">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Registered API Endpoints</CardTitle>
                      <CardDescription>API endpoints registered for access control</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search APIs..."
                          className="pl-8 w-64"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <ProtectedButton buttonId="register-api" onClick={() => setShowApiForm(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Register API
                      </ProtectedButton>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingApis ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">Loading APIs...</p>
                    </div>
                  ) : filteredApis.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-center">
                      <div className="space-y-2">
                        <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No APIs registered</p>
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Method</TableHead>
                          <TableHead>Endpoint</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Zanzibar Resource</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApis.map((api) => (
                          <TableRow key={api.id}>
                            <TableCell>
                              <span className="font-mono text-sm font-semibold">{api.method}</span>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{api.endpoint}</TableCell>
                            <TableCell>{api.description || "-"}</TableCell>
                            <TableCell className="font-mono text-xs">{api.zanzibar_resource}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Stack>

        {/* Registration Dialogs */}
        <Dialog open={showPageForm} onOpenChange={setShowPageForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Page</DialogTitle>
              <DialogDescription>
                Register a page for Zanzibar-based access control
              </DialogDescription>
            </DialogHeader>
            <RegisterPageForm
              onSuccess={() => setShowPageForm(false)}
              onCancel={() => setShowPageForm(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showButtonForm} onOpenChange={setShowButtonForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Button</DialogTitle>
              <DialogDescription>
                Register a button for Zanzibar-based access control
              </DialogDescription>
            </DialogHeader>
            <RegisterButtonForm
              defaultPageId={selectedPageId}
              onSuccess={() => setShowButtonForm(false)}
              onCancel={() => setShowButtonForm(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showFieldForm} onOpenChange={setShowFieldForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Field</DialogTitle>
              <DialogDescription>
                Register a form field for Zanzibar-based access control
              </DialogDescription>
            </DialogHeader>
            <RegisterFieldForm
              defaultPageId={selectedPageId}
              onSuccess={() => setShowFieldForm(false)}
              onCancel={() => setShowFieldForm(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showApiForm} onOpenChange={setShowApiForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New API Endpoint</DialogTitle>
              <DialogDescription>
                Register an API endpoint for Zanzibar-based access control
              </DialogDescription>
            </DialogHeader>
            <RegisterApiForm
              onSuccess={() => setShowApiForm(false)}
              onCancel={() => setShowApiForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}

// Helper component for page buttons section
function PageButtonsSection({ page }: { page: UiPage }) {
  const { data: buttonsResponse, isLoading } = useQuery({
    queryKey: ["uiButtons", page.id],
    queryFn: () => listButtonsForPage(page.id),
    enabled: !!page.id,
  });

  const buttons = buttonsResponse?.data?.buttons || [];

  if (isLoading) return null;

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">{page.name}</h3>
      {buttons.length === 0 ? (
        <p className="text-sm text-muted-foreground">No buttons registered</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Button ID</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Zanzibar Resource</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buttons.map((button) => (
              <TableRow key={button.id}>
                <TableCell className="font-mono text-sm">{button.button_id}</TableCell>
                <TableCell>{button.label}</TableCell>
                <TableCell>{button.action || "-"}</TableCell>
                <TableCell className="font-mono text-xs">{button.zanzibar_resource}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// Helper component for page fields section
function PageFieldsSection({ page }: { page: UiPage }) {
  const { data: fieldsResponse, isLoading } = useQuery({
    queryKey: ["uiFields", page.id],
    queryFn: () => listFieldsForPage(page.id),
    enabled: !!page.id,
  });

  const fields = fieldsResponse?.data?.fields || [];

  if (isLoading) return null;

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">{page.name}</h3>
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">No fields registered</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field ID</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Zanzibar Resource</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell className="font-mono text-sm">{field.field_id}</TableCell>
                <TableCell>{field.label}</TableCell>
                <TableCell>{field.field_type}</TableCell>
                <TableCell className="font-mono text-xs">{field.zanzibar_resource}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

