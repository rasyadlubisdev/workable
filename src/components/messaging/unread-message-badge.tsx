"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UnreadMessageBadgeProps {
  className?: string;
}

export function UnreadMessageBadge({ className }: UnreadMessageBadgeProps) {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;

      snapshot.docs.forEach((doc) => {
        const chatData = doc.data();
        const messages = chatData.messages || [];
        const unread = messages.filter(
          (msg: any) => !msg.read && msg.senderId !== currentUser.uid
        ).length;
        total += unread;
      });

      setUnreadCount(total);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (unreadCount === 0) return null;

  return (
    <Badge
      variant="destructive"
      className={cn(
        "absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 flex items-center justify-center",
        className
      )}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}
