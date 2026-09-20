"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users } from "lucide-react";

interface Branch {
  id: number;
  name: string;
  location: string;
  userCount: number;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setBranches(result.branches);
      })
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-2xl font-bold">Branches</h1>
        <p className="text-muted-foreground">Manage store locations</p>
      </div>

      <Card className="border border-gray-200 rounded-md">
        <CardHeader>
          <CardTitle>All Branches</CardTitle>
        </CardHeader>
        <CardContent>
          {branches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Staff Count</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.id} className="border-b border-gray-100 last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {branch.name}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{branch.location}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {branch.userCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No branches found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
