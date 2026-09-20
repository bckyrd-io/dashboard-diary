"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Building2 } from "lucide-react";

interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: string;
  branchId: number | null;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setUsers(result.users);
      })
      .finally(() => setLoading(false));
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return <Badge variant="default">Admin</Badge>;
      case "staff":
        return <Badge variant="secondary">Staff</Badge>;
      case "manager":
        return <Badge variant="outline" className="border-blue-200 text-blue-700">Manager</Badge>;
      default:
        return <Badge variant="outline">{role || "Unknown"}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage team members</p>
      </div>

      <Card className="border border-gray-200 rounded-md">
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Username</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {user.username}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {user.branchId || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No users found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
