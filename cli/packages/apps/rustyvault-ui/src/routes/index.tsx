import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, Stack, Badge } from '@health-v1/ui-components';
import { Activity, CheckCircle2, XCircle, Globe, Lock, Settings } from 'lucide-react';
import { systemApi, realmsApi, secretsApi } from '@/lib/api';

export function DashboardPage() {
  const { data: sealStatus, isLoading: isLoadingSeal } = useQuery({
    queryKey: ['sealStatus'],
    queryFn: () => systemApi.getSealStatus(),
    refetchInterval: 30000,
  });

  const { data: realms, isLoading: isLoadingRealms } = useQuery({
    queryKey: ['realms'],
    queryFn: () => realmsApi.list(),
    refetchInterval: 60000,
  });

  const { data: mounts, isLoading: isLoadingMounts } = useQuery({
    queryKey: ['mounts'],
    queryFn: () => systemApi.listMounts(),
    refetchInterval: 60000,
  });

  const { data: secrets, isLoading: isLoadingSecrets } = useQuery({
    queryKey: ['secrets', 'kv2', ''],
    queryFn: () => secretsApi.list('kv2', ''),
    enabled: !!mounts && 'kv2' in mounts,
    refetchInterval: 60000,
  });

  const mountCount = mounts ? Object.keys(mounts).length : 0;
  const realmCount = realms?.length || 0;
  const secretCount = secrets?.length || 0;

  return (
    <div className="p-6">
      <Stack spacing="lg">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of RustyVault system status</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seal Status</CardTitle>
              {sealStatus?.sealed ? (
                <XCircle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${sealStatus?.sealed ? 'text-destructive' : 'text-green-600'}`}>
                {isLoadingSeal ? '-' : sealStatus?.sealed ? 'Sealed' : 'Unsealed'}
              </div>
              {sealStatus && (
                <p className="text-xs text-muted-foreground">
                  Progress: {sealStatus.progress} / {sealStatus.n}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Realms</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingRealms ? <span className="text-muted-foreground">-</span> : realmCount}
              </div>
              <p className="text-xs text-muted-foreground">Active realms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mounts</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingMounts ? <span className="text-muted-foreground">-</span> : mountCount}
              </div>
              <p className="text-xs text-muted-foreground">Configured mounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Secrets</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingSecrets ? <span className="text-muted-foreground">-</span> : secretCount}
              </div>
              <p className="text-xs text-muted-foreground">Total secrets</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSeal ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : sealStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={sealStatus.sealed ? 'destructive' : 'default'}>
                      {sealStatus.sealed ? 'Sealed' : 'Unsealed'}
                    </Badge>
                  </div>
                  {sealStatus.version && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Version</span>
                      <span>{sealStatus.version}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load system status</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack spacing="sm">
                <p className="text-sm text-muted-foreground">
                  Manage your secrets, realms, and system configuration from the navigation menu.
                </p>
              </Stack>
            </CardContent>
          </Card>
        </div>
      </Stack>
    </div>
  );
}

