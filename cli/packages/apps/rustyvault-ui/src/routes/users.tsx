import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { usersApi, CreateUserRequest } from '@/lib/api';
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
import { Plus, Trash2, Edit, User as UserIcon, Users } from 'lucide-react';

export function UsersPage() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CreateUserRequest & { username: string }>({
    username: '',
    password: '',
    policies: [],
    ttl: 3600,
    max_ttl: 86400,
  });
  const [policiesInput, setPoliciesInput] = useState('');

  // Fetch users list
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });

  // Fetch selected user details
  const { data: userDetails } = useQuery({
    queryKey: ['user', selectedUser],
    queryFn: () => usersApi.read(selectedUser!),
    enabled: !!selectedUser && !isCreating,
  });

  // Create/update user mutation
  const saveUserMutation = useMutation({
    mutationFn: ({ username, ...request }: CreateUserRequest & { username: string }) =>
      usersApi.write(username, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', selectedUser] });
      setIsCreating(false);
      setIsEditing(false);
      resetForm();
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (username: string) => usersApi.delete(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUser(null);
    },
  });

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      policies: [],
      ttl: 3600,
      max_ttl: 86400,
    });
    setPoliciesInput('');
  };

  const handleSaveUser = () => {
    const policies = policiesInput
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    saveUserMutation.mutate({ ...formData, policies });
  };

  const handleEditUser = () => {
    if (userDetails?.data) {
      const user = userDetails.data;
      setFormData({
        username: user.username,
        password: '', // Password is not returned
        policies: user.policies,
        ttl: user.ttl,
        max_ttl: user.max_ttl,
      });
      setPoliciesInput(user.policies.join(', '));
      setIsEditing(true);
    }
  };

  const users = usersData?.keys || [];
  const user = userDetails?.data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage UserPass authentication users
          </p>
        </div>
        <Button onClick={() => {
          setIsCreating(true);
          setSelectedUser(null);
          setIsEditing(false);
          resetForm();
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New User
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
            <CardDescription>
              {users.length} {users.length === 1 ? 'user' : 'users'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((username) => (
                  <div
                    key={username}
                    className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedUser === username
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => {
                      setSelectedUser(username);
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{username}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details / Create Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {isCreating
                ? 'Create New User'
                : isEditing
                ? `Edit User: ${selectedUser}`
                : selectedUser
                ? `User: ${selectedUser}`
                : 'Select a User'}
            </CardTitle>
            <CardDescription>
              {isCreating
                ? 'Create a new UserPass user'
                : isEditing
                ? 'Update user settings'
                : selectedUser
                ? 'View and manage user details'
                : 'Select a user from the list to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCreating || isEditing ? (
              <div className="space-y-4">
                {isCreating && (
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="johndoe"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="password">
                    Password {isEditing && '(leave blank to keep current)'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={isEditing ? '••••••••' : 'Enter password'}
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
                    <Label htmlFor="ttl">Token TTL (seconds)</Label>
                    <Input
                      id="ttl"
                      type="number"
                      value={formData.ttl}
                      onChange={(e) =>
                        setFormData({ ...formData, ttl: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_ttl">Max Token TTL (seconds)</Label>
                    <Input
                      id="max_ttl"
                      type="number"
                      value={formData.max_ttl}
                      onChange={(e) =>
                        setFormData({ ...formData, max_ttl: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveUser}
                    disabled={saveUserMutation.isPending || (!isEditing && !formData.username)}
                  >
                    {saveUserMutation.isPending
                      ? 'Saving...'
                      : isCreating
                      ? 'Create User'
                      : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : selectedUser && user ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Username</Label>
                  <p className="font-medium">{user.username}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Policies</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.policies?.length > 0 ? (
                      user.policies.map((policy) => (
                        <Badge key={policy} variant="secondary">
                          {policy}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No policies</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Token TTL</Label>
                    <p className="font-medium">{user.ttl}s</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Max Token TTL</Label>
                    <p className="font-medium">{user.max_ttl}s</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={handleEditUser}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteUserMutation.mutate(selectedUser)}
                    disabled={deleteUserMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a user from the list to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

