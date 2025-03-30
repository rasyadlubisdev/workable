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
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UnreadMessageBadge } from "@/components/messaging/unread-message-badge";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  pathname: string;
}

export function Sidebar({ collapsed, setCollapsed, pathname }: SidebarProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const navItems = [
    {
      href: "/",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/profile",
      icon: User,
      label: "Profile",
    },
    {
      href: "/journeys",
      icon: BookText,
      label: "Journeys",
    },
    {
      href: "/challenges",
      icon: Target,
      label: "Challenges",
    },
    {
      href: "/connect",
      icon: Users,
      label: "Connect",
    },
    {
      href: "/messages",
      icon: MessageSquare,
      label: "Messages",
    },
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);

      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [setCollapsed]);

  if (!isMobile) {
    return (
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-card border-r",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="h-full px-3 py-4 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className={`flex items-center ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              {!collapsed && (
                <span className="ml-3 font-semibold text-lg">
                  AchieveConnect
                </span>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-md p-2 hover:bg-muted"
            >
              {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
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

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full h-16 bg-background border-t">
      <div className="grid grid-cols-5 h-full">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1",
              pathname === item.href
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.icon === MessageSquare && (
                <UnreadMessageBadge className="absolute -top-1 -right-1 h-4 w-4 text-[10px]" />
              )}
            </div>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
