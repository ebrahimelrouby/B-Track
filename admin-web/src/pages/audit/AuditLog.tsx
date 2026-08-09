import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import BarList from "@/components/charts/BarList";
import { listAuditLog } from "@/api/exercises";

const ACTION_COLORS: Record<string, string> = {
  CREATE:       "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/60",
  UPDATE:       "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/60",
  STATUS_CHANGE:"text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950/60",
  DELETE:       "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/60",
  IMPORT:       "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/60",
  BULK_EDIT:    "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/60",
};

// Six-hue set validated together for CVD-safe pairwise separation regardless of
// display order (BarList sorts by value, so any two can end up adjacent).
const ACTION_HEX: Record<string, string> = {
  CREATE: "#16a34a",
  UPDATE: "#2563eb",
  STATUS_CHANGE: "#0891b2",
  DELETE: "#dc2626",
  IMPORT: "#9333ea",
  BULK_EDIT: "#ea580c",
};

export default function AuditLog() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", page],
    queryFn: () => listAuditLog(page),
  });

  // Separate, larger sample purely to power the breakdown chart below — decoupled
  // from the paginated table query so switching table pages doesn't reshape it.
  const { data: sample } = useQuery({
    queryKey: ["audit-log-sample"],
    queryFn: () => listAuditLog(0, 200),
  });

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const actionCounts = (sample?.content ?? []).reduce<Record<string, number>>((acc, entry) => {
    acc[entry.action] = (acc[entry.action] ?? 0) + 1;
    return acc;
  }, {});
  const actionData = Object.entries(actionCounts).map(([label, value]) => ({
    label,
    value,
    color: ACTION_HEX[label],
  }));

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Audit Log" description="All admin actions — read-only" />

      {actionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions by Type</CardTitle>
            <CardDescription>Based on the most recent {sample?.content.length ?? 0} entries</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList data={actionData} color={ACTION_HEX.CREATE} maxItems={6} />
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-3 text-left font-medium text-muted-foreground">Time</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Action</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Exercise</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Admin</th>
                <th className="p-3 text-left font-medium text-muted-foreground">IP</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Changes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="p-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    No audit entries yet
                  </td>
                </tr>
              ) : (
                items.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(entry.createdAt), "MMM d, HH:mm:ss")}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[entry.action] ?? "text-muted-foreground bg-muted"}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{entry.entityName ?? entry.entityId}</td>
                    <td className="p-3 text-muted-foreground">{entry.adminEmail ?? "—"}</td>
                    <td className="p-3 text-muted-foreground font-mono text-xs">{entry.ipAddress ?? "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {entry.beforeValue && entry.afterValue ? (
                        <span>
                          {JSON.stringify(entry.afterValue).slice(0, 60)}
                          {JSON.stringify(entry.afterValue).length > 60 ? "…" : ""}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
