"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle, Clock, XCircle } from "lucide-react";

interface PerformanceRecord {
  id: number;
  userId: number;
  username: string;
  branch_name: string | null;
  role: string;
  activity: string | null;
  status: string;
  updatedAt: string;
}

export default function PerformancePage() {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/performance")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setRecords(result.performance);
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "in progress":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "assigned":
        return (
          <Badge variant="outline">
            <User className="h-3 w-3 mr-1" />
            Assigned
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
        <h1 className="text-2xl font-bold">Performance</h1>
        <p className="text-muted-foreground">Staff performance tracking</p>
      </div>

      <Card className="border border-gray-200 rounded-md">
        <CardHeader>
          <CardTitle>Performance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Staff</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Branch</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Activity</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {record.username}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{record.branch_name || "-"}</td>
                      <td className="py-3 px-4 max-w-xs truncate">{record.activity || "-"}</td>
                      <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(record.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No performance records found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
