"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search, MessagesSquare } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ChatWithUserDetails } from "@/types/chat";
import Link from "next/link";

export default function MessagesPage() {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<ChatWithUserDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const chatsList: ChatWithUserDetails[] = [];

        for (const doc of snapshot.docs) {
          const chatData = doc.data();

          const otherUserId = chatData.participants.find(
            (id: string) => id !== currentUser.uid
          );

          if (otherUserId) {
            const userRef = doc.ref.firestore.doc(`users/${otherUserId}`);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();

              chatsList.push({
                id: doc.id,
                ...chatData,
                otherUser: {
                  id: otherUserId,
                  username: userData.username || "Unknown User",
                  profileImage: userData.profileImage || "",
                },
              });
            }
          }
        }

        setChats(chatsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const formatChatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate();

    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    return chat.otherUser.username
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : chats.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="pt-12">
            <MessagesSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="text-muted-foreground mb-6">
              Start a conversation with someone to begin messaging
            </p>
            <Link href="/connect">
              <Button>Connect with others</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-background border rounded-lg overflow-hidden">
          {filteredChats.map((chat, index) => (
            <div key={chat.id}>
              <Link href={`/messages/${chat.id}`}>
                <div className="flex items-center p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage
                      src={chat.otherUser.profileImage}
                      alt={chat.otherUser.username}
                    />
                    <AvatarFallback>
                      {chat.otherUser.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-medium truncate">
                        {chat.otherUser.username}
                      </h3>
                      {chat.updatedAt && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatChatTimestamp(chat.updatedAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage?.text || "Start a conversation"}
                    </p>
                  </div>
                </div>
              </Link>
              {index < filteredChats.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
