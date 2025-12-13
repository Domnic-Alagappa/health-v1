import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { tokensApi, CreateTokenRequest } from '@/lib/api';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Badge,
} from '@health-v1/ui-components';
import { Key, RefreshCw, Trash2, Plus, Copy, Check } from 'lucide-react';

export function TokensPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTokenRequest>({
    display_name: '',
    policies: [],
    ttl: 3600,
    renewable: true,
    num_uses: 0,
  });
  const [policiesInput, setPoliciesInput] = useState('');

  // Fetch current token info
  const { data: tokenInfo, isLoading } = useQuery({
    queryKey: ['token-self'],
    queryFn: () => tokensApi.lookupSelf(),
  });

  // Create token mutation
  const createTokenMutation = useMutation({
    mutationFn: (request: CreateTokenRequest) => tokensApi.create(request),
    onSuccess: (data) => {
      setNewToken(data.auth.client_token);
      setIsCreating(false);
      setCreateForm({
        display_name: '',
        policies: [],
        ttl: 3600,
        renewable: true,
        num_uses: 0,
      });
      setPoliciesInput('');
    },
  });

  // Renew token mutation
  const renewTokenMutation = useMutation({
    mutationFn: () => tokensApi.renewSelf(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-self'] });
    },
  });

  // Revoke self token mutation
  const revokeSelfMutation = useMutation({
    mutationFn: () => tokensApi.revokeSelf(),
    onSuccess: () => {
      // Logout after revoking self
      window.location.href = '/login';
    },
  });

  const handleCreateToken = () => {
    const policies = policiesInput
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    createTokenMutation.mutate({ ...createForm, policies });
  };

  const handleCopyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const token = tokenInfo?.data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tokens</h1>
          <p className="text-muted-foreground">
            Manage authentication tokens
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Token
        </Button>
      </div>

      {/* New Token Display */}
      {newToken && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-lg text-green-700 dark:text-green-300">
              New Token Created
            </CardTitle>
            <CardDescription>
              Copy this token now. You won't be able to see it again!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-background border rounded-md font-mono text-sm break-all">
                {newToken}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopyToken}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setNewToken(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Token Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              Current Token
            </CardTitle>
            <CardDescription>
              Information about your current authentication token
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : token ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Display Name</Label>
                  <p className="font-medium">{token.display_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Policies</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {token.policies?.map((policy) => (
                      <Badge key={policy} variant="secondary">
                        {policy}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">TTL</Label>
                    <p className="font-medium">{token.ttl ? `${token.ttl}s` : 'Never'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Renewable</Label>
                    <p className="font-medium">{token.renewable ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                {token.expires_at && (
                  <div>
                    <Label className="text-muted-foreground">Expires At</Label>
                    <p className="font-medium">
                      {new Date(token.expires_at).toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  {token.renewable && (
                    <Button
                      variant="outline"
                      onClick={() => renewTokenMutation.mutate()}
                      disabled={renewTokenMutation.isPending}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {renewTokenMutation.isPending ? 'Renewing...' : 'Renew Token'}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => revokeSelfMutation.mutate()}
                    disabled={revokeSelfMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {revokeSelfMutation.isPending ? 'Revoking...' : 'Revoke & Logout'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Unable to load token information
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Token Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isCreating ? 'Create New Token' : 'Token Generation'}
            </CardTitle>
            <CardDescription>
              {isCreating
                ? 'Configure and create a new token'
                : 'Create child tokens for applications'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCreating ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={createForm.display_name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, display_name: e.target.value })
                    }
                    placeholder="my-app-token"
                  />
                </div>
                <div>
                  <Label htmlFor="policies">Policies (comma-separated)</Label>
                  <Input
                    id="policies"
                    value={policiesInput}
                    onChange={(e) => setPoliciesInput(e.target.value)}
                    placeholder="default, my-policy"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ttl">TTL (seconds)</Label>
                    <Input
                      id="ttl"
                      type="number"
                      value={createForm.ttl}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, ttl: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="num_uses">Max Uses (0 = unlimited)</Label>
                    <Input
                      id="num_uses"
                      type="number"
                      value={createForm.num_uses}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, num_uses: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="renewable"
                    checked={createForm.renewable}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, renewable: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="renewable">Renewable</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleCreateToken}
                    disabled={createTokenMutation.isPending}
                  >
                    {createTokenMutation.isPending ? 'Creating...' : 'Create Token'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click "Create Token" to generate a new token</p>
                <Button className="mt-4" onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Token
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

