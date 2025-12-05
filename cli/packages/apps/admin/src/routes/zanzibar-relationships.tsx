/**
 * Zanzibar Relationships Viewer
 * View all Zanzibar-style authorization relationships
 */

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
  Badge,
} from "@health-v1/ui-components";
import { Search, Shield, Database } from "lucide-react";
import { ProtectedPage } from "../lib/permissions";
import { listAllRelationships } from "../lib/api/permissions";

interface Relationship {
  id: string;
  user: string;
  relation: string;
  object: string;
  expires_at?: string;
  valid_from?: string;
  is_active: boolean;
  created_at?: string;
}

export function ZanzibarRelationshipsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: relationshipsResponse, isLoading, error } = useQuery({
    queryKey: ["zanzibarRelationships"],
    queryFn: async () => {
      const response = await listAllRelationships();
      return response.data;
    },
  });

  const relationships: Relationship[] = relationshipsResponse?.relationships || [];

  const filteredRelationships = relationships.filter((rel) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      rel.user.toLowerCase().includes(searchLower) ||
      rel.relation.toLowerCase().includes(searchLower) ||
      rel.object.toLowerCase().includes(searchLower)
    );
  });

  const formatTuple = (user: string, relation: string, object: string) => {
    return `${user}#${relation}@${object}`;
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isNotYetValid = (validFrom?: string) => {
    if (!validFrom) return false;
    return new Date(validFrom) > new Date();
  };

  return (
    <ProtectedPage pageName="permissions" fallback={<div className="p-6">You don't have access to this page.</div>}>
      <div className="p-6">
        <Stack spacing="lg">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zanzibar Relationships</h1>
            <p className="text-muted-foreground">
              View all authorization relationships in Zanzibar format (user#relation@object)
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Relationships</CardTitle>
                  <CardDescription>
                    Zanzibar-style relationship tuples for authorization
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search relationships..."
                    className="pl-8 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading relationships...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12 text-center">
                  <div className="space-y-2">
                    <Database className="mx-auto h-12 w-12 text-red-600" />
                    <p className="text-sm text-red-600">Failed to load relationships</p>
                    <p className="text-xs text-muted-foreground">
                      {error instanceof Error ? error.message : "Unknown error"}
                    </p>
                  </div>
                </div>
              ) : filteredRelationships.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-center">
                  <div className="space-y-2">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery
                        ? "No relationships found matching your search"
                        : "No relationships found"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tuple</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Relation</TableHead>
                        <TableHead>Object</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Valid From</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRelationships.map((rel) => {
                        const expired = isExpired(rel.expires_at);
                        const notYetValid = isNotYetValid(rel.valid_from);
                        const status = !rel.is_active
                          ? "Revoked"
                          : expired
                          ? "Expired"
                          : notYetValid
                          ? "Not Yet Valid"
                          : "Active";

                        return (
                          <TableRow key={rel.id}>
                            <TableCell className="font-mono text-sm">
                              {formatTuple(rel.user, rel.relation, rel.object)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{rel.user}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{rel.relation}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{rel.object}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  status === "Active"
                                    ? "default"
                                    : status === "Expired"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {rel.expires_at
                                ? new Date(rel.expires_at).toLocaleDateString()
                                : "Never"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {rel.valid_from
                                ? new Date(rel.valid_from).toLocaleDateString()
                                : "Immediate"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </Stack>
      </div>
    </ProtectedPage>
  );
}

