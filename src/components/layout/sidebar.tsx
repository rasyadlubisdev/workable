"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import {
  LayoutDashboard,
  User,
  BookText,
  Target,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { UnreadBadge } from "@/components/messaging/unread-badge";
import { UnreadMessageBadge } from "../messaging/unread-message-badge";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  pathname: string;
}

export function Sidebar({ collapsed, setCollapsed, pathname }: SidebarProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/journeys", icon: BookText, label: "Journeys" },
    { href: "/challenges", icon: Target, label: "Challenges" },
    { href: "/connect", icon: Users, label: "Connect" },
    { href: "/messages", icon: MessageSquare, label: "Messages" },
  ];

  return (
    <aside
      className={cn(
        "transition-all duration-300 bg-card border-r",
        "flex-shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-screen px-3 py-4 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className={`flex items-center ${collapsed ? "justify-center" : ""}`}
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            {!collapsed && (
              <span className="ml-3 font-semibold text-lg">AchieveConnect</span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="lg:flex hidden rounded-md p-2 hover:bg-muted"
          >
            {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="lg:hidden flex rounded-md p-2 hover:bg-muted"
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        <div className="flex flex-col flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                pathname === item.href
                  ? "bg-muted hover:bg-muted"
                  : "hover:bg-transparent hover:underline",
                "justify-start relative",
                collapsed ? "px-2" : ""
              )}
            >
              <item.icon className={cn("h-5 w-5", collapsed ? "" : "mr-2")} />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {item.icon === MessageSquare && <UnreadMessageBadge />}
            </Link>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "justify-start mt-6",
            collapsed ? "px-2" : ""
          )}
        >
          <LogOut className={cn("h-5 w-5", collapsed ? "" : "mr-2")} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
