import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { policiesApi } from '@/lib/api';
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
import { Plus, Trash2, Edit, FileText } from 'lucide-react';

export function PoliciesPage() {
  const queryClient = useQueryClient();
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState('');
  const [policyContent, setPolicyContent] = useState('');

  // Fetch policies list
  const { data: policiesData, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: () => policiesApi.list(),
  });

  // Fetch selected policy details
  const { data: policyDetails } = useQuery({
    queryKey: ['policy', selectedPolicy],
    queryFn: () => policiesApi.read(selectedPolicy!),
    enabled: !!selectedPolicy,
  });

  // Create/update policy mutation
  const savePolicyMutation = useMutation({
    mutationFn: ({ name, policy }: { name: string; policy: string }) =>
      policiesApi.write(name, policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['policy', selectedPolicy] });
      setIsCreating(false);
      setNewPolicyName('');
      setPolicyContent('');
    },
  });

  // Delete policy mutation
  const deletePolicyMutation = useMutation({
    mutationFn: (name: string) => policiesApi.delete(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setSelectedPolicy(null);
    },
  });

  const handleCreatePolicy = () => {
    if (newPolicyName && policyContent) {
      savePolicyMutation.mutate({ name: newPolicyName, policy: policyContent });
    }
  };

  const handleUpdatePolicy = () => {
    if (selectedPolicy && policyContent) {
      savePolicyMutation.mutate({ name: selectedPolicy, policy: policyContent });
    }
  };

  const policies = policiesData?.keys || [];

  // Default policy template
  const defaultPolicyTemplate = `{
  "name": "example-policy",
  "path": {
    "secret/*": {
      "capabilities": ["read", "list"]
    },
    "secret/data/*": {
      "capabilities": ["create", "read", "update", "delete", "list"]
    }
  }
}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Policies</h1>
          <p className="text-muted-foreground">
            Manage access control policies for RustyVault
          </p>
        </div>
        <Button onClick={() => {
          setIsCreating(true);
          setSelectedPolicy(null);
          setPolicyContent(defaultPolicyTemplate);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policies List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">ACL Policies</CardTitle>
            <CardDescription>
              {policies.length} {policies.length === 1 ? 'policy' : 'policies'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : policies.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No policies found
              </div>
            ) : (
              <div className="space-y-2">
                {policies.map((policy) => (
                  <div
                    key={policy}
                    className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedPolicy === policy
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => {
                      setSelectedPolicy(policy);
                      setIsCreating(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{policy}</span>
                    </div>
                    {policy === 'root' || policy === 'default' ? (
                      <Badge variant="secondary">System</Badge>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Policy Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {isCreating ? 'Create New Policy' : selectedPolicy ? `Policy: ${selectedPolicy}` : 'Select a Policy'}
            </CardTitle>
            <CardDescription>
              {isCreating
                ? 'Define a new access control policy'
                : selectedPolicy
                ? 'View and edit policy details'
                : 'Select a policy from the list to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCreating ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="policy-name">Policy Name</Label>
                  <Input
                    id="policy-name"
                    value={newPolicyName}
                    onChange={(e) => setNewPolicyName(e.target.value)}
                    placeholder="my-policy"
                  />
                </div>
                <div>
                  <Label htmlFor="policy-content">Policy Content (JSON)</Label>
                  <textarea
                    id="policy-content"
                    value={policyContent}
                    onChange={(e) => setPolicyContent(e.target.value)}
                    className="w-full h-64 p-3 font-mono text-sm border rounded-md bg-background resize-y"
                    placeholder="Enter policy JSON..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreatePolicy} disabled={savePolicyMutation.isPending}>
                    {savePolicyMutation.isPending ? 'Creating...' : 'Create Policy'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : selectedPolicy ? (
              <div className="space-y-4">
                <div>
                  <Label>Policy Content</Label>
                  <textarea
                    value={policyDetails?.policy || policyContent}
                    onChange={(e) => setPolicyContent(e.target.value)}
                    className="w-full h-64 p-3 font-mono text-sm border rounded-md bg-background resize-y"
                    readOnly={selectedPolicy === 'root' || selectedPolicy === 'default'}
                  />
                </div>
                {selectedPolicy !== 'root' && selectedPolicy !== 'default' && (
                  <div className="flex gap-2">
                    <Button onClick={handleUpdatePolicy} disabled={savePolicyMutation.isPending}>
                      <Edit className="h-4 w-4 mr-2" />
                      {savePolicyMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deletePolicyMutation.mutate(selectedPolicy)}
                      disabled={deletePolicyMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deletePolicyMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a policy from the list to view and edit</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

