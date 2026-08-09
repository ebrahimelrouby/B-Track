import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/layout/PageHeader";
import { listImportProviders, triggerImport } from "@/api/exercises";
import type { ImportHistory } from "@/types";

export default function ImportWizard() {
  const navigate = useNavigate();
  const [provider, setProvider] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<ImportHistory | null>(null);

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ["import-providers"],
    queryFn: listImportProviders,
  });

  const importMutation = useMutation({
    mutationFn: () => triggerImport({ provider, dryRun }),
    onSuccess: (data) => setResult(data),
  });

  const providerNames = providers.map((p) => p.split(" — ")[0]);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Import Exercises"
        description="Import exercises from external providers. Run a dry-run first to preview changes."
      />

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.status === "COMPLETED"
                ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                : <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
              Import {result.status}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Stat label="Imported" value={result.importedCount} color="text-green-600 dark:text-green-400" />
              <Stat label="Skipped" value={result.skippedCount} color="text-muted-foreground" />
              <Stat label="Errors" value={result.errorCount} color="text-red-500 dark:text-red-400" />
            </div>

            {result.durationMs !== undefined && (
              <p className="text-sm text-muted-foreground">
                Completed in {(result.durationMs / 1000).toFixed(1)}s
              </p>
            )}

            {result.errors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive space-y-1">
                {result.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
                {result.errors.length > 5 && <div>… and {result.errors.length - 5} more</div>}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)}>Run Another Import</Button>
              <Button variant="outline" onClick={() => navigate("/import/history")}>
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Configure Import</CardTitle>
            <CardDescription>Select a provider and options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Provider</Label>
              {loadingProviders ? (
                <div className="h-10 bg-muted rounded animate-pulse" />
              ) : (
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select import provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {providerNames.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="dryRun"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="rounded"
              />
              <div>
                <Label htmlFor="dryRun" className="cursor-pointer">Dry Run (Preview Only)</Label>
                <p className="text-xs text-muted-foreground">No data will be saved</p>
              </div>
            </div>

            <div className="rounded-md bg-muted p-4 text-sm space-y-1">
              <p className="font-medium">Import Pipeline</p>
              <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Load records from provider</li>
                <li>Validate and normalize fields</li>
                <li>Detect duplicates by external ID</li>
                <li>Calculate quality scores</li>
                <li>Save as DRAFT status</li>
                <li>Generate report</li>
              </ol>
            </div>

            {importMutation.error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {(importMutation.error as Error).message}
              </div>
            )}

            <Button
              onClick={() => importMutation.mutate()}
              disabled={!provider || importMutation.isPending}
              className="w-full"
            >
              {importMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing…</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" />{dryRun ? "Preview Import" : "Start Import"}</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}
