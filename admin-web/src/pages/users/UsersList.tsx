import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { Users as UsersIcon, Radio, UserPlus, CalendarDays, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";
import { listUsers, getUserStats } from "@/api/users";

export default function UsersList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Polled every 20s so the "online now" state stays close to real-time
  // without needing a websocket/presence channel.
  const { data: stats } = useQuery({
    queryKey: ["user-stats"],
    queryFn: getUserStats,
    refetchInterval: 20_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", { search, page }],
    queryFn: () => listUsers({ search: search || undefined, page }),
    refetchInterval: 20_000,
  });

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  const statCards = [
    { label: "Total Registered", value: stats?.totalUsers, icon: UsersIcon, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/60" },
    { label: "Online Now", value: stats?.onlineNow, icon: Radio, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/60" },
    { label: "New Today", value: stats?.newToday, icon: UserPlus, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/60" },
    { label: "New This Week", value: stats?.newThisWeek, icon: CalendarDays, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/60" },
  ];

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Users" description={`${totalElements} registered user${totalElements === 1 ? "" : "s"}`} />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value ?? "—"}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Last Active</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${u.online ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"}`}
                        />
                        <span className={`text-xs font-medium ${u.online ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {u.online ? "Online" : "Offline"}
                        </span>
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{u.firstName} {u.lastName}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        u.role === "SUPER_ADMIN" ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400" :
                        u.role === "ADMIN" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400" :
                        "bg-muted text-muted-foreground"
                      }`}>{u.role}</span>
                    </td>
                    <td className="p-3 text-muted-foreground" title={format(new Date(u.createdAt), "PPpp")}>
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {u.lastActiveAt ? formatDistanceToNow(new Date(u.lastActiveAt), { addSuffix: true }) : "Never"}
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
              <button
                className="px-3 py-1.5 text-sm rounded-md border disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded-md border disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
