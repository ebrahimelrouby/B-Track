import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BarList from "@/components/charts/BarList";
import PageHeader from "@/components/layout/PageHeader";
import { listImportHistory } from "@/api/exercises";

// Green/red match STATUS_COLOR's published/rejected; slate for "skipped" reuses the
// same desaturated neutral-state exception as archived, paired with a direct label.
const RESULT_COLOR = { imported: "#16a34a", skipped: "#64748b", errors: "#dc2626" } as const;

const STATUS_ICON: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
  FAILED:    <XCircle className="h-4 w-4 text-red-500" />,
  PROCESSING: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  PENDING:   <Clock className="h-4 w-4 text-muted-foreground" />,
  ROLLED_BACK: <XCircle className="h-4 w-4 text-gray-400" />,
};

export default function ImportHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ["import-history"],
    queryFn: () => listImportHistory(),
    refetchInterval: 5000,
  });

  const items = data?.content ?? [];

  const totals = items.reduce(
    (acc, item) => ({
      imported: acc.imported + item.importedCount,
      skipped: acc.skipped + item.skippedCount,
      errors: acc.errors + item.errorCount,
    }),
    { imported: 0, skipped: 0, errors: 0 }
  );
  const resultData = [
    { label: "Imported", value: totals.imported, color: RESULT_COLOR.imported },
    { label: "Skipped", value: totals.skipped, color: RESULT_COLOR.skipped },
    { label: "Errors", value: totals.errors, color: RESULT_COLOR.errors },
  ];

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Import History" description="All past exercise import runs" />

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Results — Most Recent {items.length} Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={resultData} color={RESULT_COLOR.imported} sortByValue={false} />
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-3 text-left font-medium text-muted-foreground">Provider</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-right font-medium text-muted-foreground">Imported</th>
                <th className="p-3 text-right font-medium text-muted-foreground">Skipped</th>
                <th className="p-3 text-right font-medium text-muted-foreground">Errors</th>
                <th className="p-3 text-right font-medium text-muted-foreground">Duration</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="p-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    No import runs yet
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium">{item.provider}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {STATUS_ICON[item.status]}
                        <Badge variant={item.status === "COMPLETED" ? "success" : item.status === "FAILED" ? "destructive" : "muted"}>
                          {item.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3 text-right text-green-600 dark:text-green-400 font-medium">{item.importedCount}</td>
                    <td className="p-3 text-right text-muted-foreground">{item.skippedCount}</td>
                    <td className="p-3 text-right text-red-500 dark:text-red-400">{item.errorCount}</td>
                    <td className="p-3 text-right text-muted-foreground">
                      {item.durationMs ? `${(item.durationMs / 1000).toFixed(1)}s` : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {format(new Date(item.createdAt), "MMM d, yyyy HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
