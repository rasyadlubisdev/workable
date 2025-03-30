"use client";

import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { NotificationsPopover } from "@/components/notifications/notifications-popover";
import { MessageSquare, Menu } from "lucide-react";
import Link from "next/link";
import { UnreadMessageBadge } from "@/components/messaging/unread-message-badge";

interface TopNavProps {
  onToggleSidebar: () => void;
}

export function TopNav({ onToggleSidebar }: TopNavProps) {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUsername(userData.username || "");
          setProfileImage(userData.profileImage || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  if (!currentUser) return null;

  return (
    <div
      className="border-b fixed top-0 right-0 left-0 z-30 bg-background"
      style={{ left: isMobile ? 0 : "" }}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="font-semibold text-lg md:hidden">AchieveConnect</h1>
        </div>

        <div className="flex items-center gap-2">
          {isMobile && (
            <Link href="/messages" className="relative">
              <Button variant="ghost" size="icon">
                <MessageSquare className="h-5 w-5" />
                <UnreadMessageBadge />
              </Button>
            </Link>
          )}
          <NotificationsPopover />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profileImage} alt={username} />
                  <AvatarFallback>
                    {username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/challenges")}>
                My Challenges
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/journeys")}>
                My Journey
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
