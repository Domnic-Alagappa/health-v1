import { Card, CardContent, CardHeader, CardTitle, Stack } from '@health-v1/ui-components';

export function SystemPage() {
  return (
    <div className="p-6">
      <Stack spacing="lg">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System</h1>
          <p className="text-muted-foreground">System operations and configuration</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              System operations interface will be implemented here using shared components.
            </p>
          </CardContent>
        </Card>
      </Stack>
    </div>
  );
}

