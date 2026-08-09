import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Dumbbell, Upload, History, Image, Languages,
  GitMerge, FileCheck, ClipboardList, LogOut, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/auth/authStore";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/theme/ThemeToggle";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/exercises", icon: Dumbbell, label: "Exercises" },
  { to: "/exercises/quality", icon: FileCheck, label: "Quality Review" },
  { to: "/exercises/duplicates", icon: GitMerge, label: "Duplicates" },
  { to: "/exercises/bulk-edit", icon: ClipboardList, label: "Bulk Edit" },
  { to: "/import", icon: Upload, label: "Import" },
  { to: "/import/history", icon: History, label: "Import History" },
  { to: "/media", icon: Image, label: "Media Manager" },
  { to: "/translations", icon: Languages, label: "Translations" },
  { to: "/audit-log", icon: ClipboardList, label: "Audit Log", adminOnly: true },
];

export default function Sidebar() {
  const { firstName, lastName, role, logout } = useAuthStore();
  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-xs font-bold text-primary-foreground">BT</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">B-Track Admin</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV.filter((n) => !n.adminOnly || isSuperAdmin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
            {firstName?.[0]}{lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{firstName} {lastName}</div>
            <div className="text-xs text-muted-foreground truncate">{role}</div>
          </div>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
