import { Card, CardContent, CardHeader, CardTitle, Stack, Button } from '@health-v1/ui-components';
import { Plus } from 'lucide-react';

export function RealmsPage() {
  return (
    <div className="p-6">
      <Stack spacing="lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Realms</h1>
            <p className="text-muted-foreground">Manage multi-tenant realms</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Realm
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Realms Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Realm management interface will be implemented here using shared components.
            </p>
          </CardContent>
        </Card>
      </Stack>
    </div>
  );
}

