"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

interface UnreadBadgeProps {
  chatId?: string;
}

export function UnreadBadge({ chatId }: UnreadBadgeProps) {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    let unsubscribe;

    if (chatId) {
      const chatRef = doc(db, "chats", chatId);
      unsubscribe = onSnapshot(chatRef, (doc) => {
        if (doc.exists()) {
          const chatData = doc.data();
          const messages = chatData.messages || [];
          const unread = messages.filter(
            (msg: any) => !msg.read && msg.senderId !== currentUser.uid
          ).length;
          setUnreadCount(unread);
        }
      });
    } else {
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", currentUser.uid)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
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
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, chatId]);

  if (unreadCount === 0) return null;

  return (
    <Badge variant="destructive" className="h-5 min-w-5 px-1.5 rounded-full">
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}
