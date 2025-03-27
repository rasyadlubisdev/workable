"use client";

import { useState, useEffect, useRef, use } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { Chat, Message } from "@/types/chat";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = use(params);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    const chatRef = doc(db, "chats", chatId);

    const unsubscribeChat = onSnapshot(chatRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Chat;
        setChat(data);

        const otherUserId = data.participants.find(
          (uid) => uid !== currentUser.uid
        );
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, "users", otherUserId));
          if (userDoc.exists()) {
            setOtherUser(userDoc.data());
          }
        }
      } else {
        setChat(null);
      }

      setLoading(false);
    });

    const messagesRef = collection(db, "chats", chatId, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribeMessages = onSnapshot(messagesQuery, (querySnap) => {
      const msgs: Message[] = [];
      querySnap.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      markMessagesAsRead(msgs);
    });

    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [chatId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const markMessagesAsRead = async (msgs: Message[]) => {
    if (!currentUser) return;

    const unread = msgs.filter(
      (m) => !m.read && m.senderId !== currentUser.uid
    );

    if (unread.length === 0) return;

    const batch = unread.map(async (msg) => {
      const msgRef = doc(db, "chats", chatId, "messages", msg.id);
      await updateDoc(msgRef, { read: true });
    });

    await Promise.all(batch);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!currentUser || !chat || !newMessage.trim()) return;

    try {
      setSending(true);

      const messageData = {
        senderId: currentUser.uid,
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
        read: false,
      };

      await addDoc(collection(db, "chats", chatId, "messages"), messageData);

      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        lastMessage: {
          text: newMessage.trim(),
          createdAt: serverTimestamp(),
          senderId: currentUser.uid,
        },
        updatedAt: serverTimestamp(),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatMessageDate = (timestamp: Timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();

    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chat || !otherUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Chat not found or you don't have access.
        </p>
        <Link href="/messages">
          <Button variant="outline" className="mt-4">
            Back to Messages
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]">
      <div className="flex items-center px-2 py-3 border-b">
        <Button
          variant="ghost"
          onClick={() => router.push("/messages")}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Link href={`/profile/${otherUser.uid}`} className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage
              src={otherUser.profileImage}
              alt={otherUser.username}
            />
            <AvatarFallback>
              {otherUser.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium text-sm">{otherUser.username}</h2>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">No messages yet.</p>
            <p className="text-muted-foreground">
              Start the conversation by sending a message.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isSender = message.senderId === currentUser?.uid;
            const showTimestamp =
              index === 0 ||
              messages[index - 1].senderId !== message.senderId ||
              (message.createdAt &&
                messages[index - 1].createdAt &&
                Math.abs(
                  message.createdAt.seconds -
                    messages[index - 1].createdAt.seconds
                ) > 300);

            return (
              <div
                key={message.id}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[70%]`}>
                  {showTimestamp && (
                    <div className="text-xs text-muted-foreground my-1 text-center">
                      {message.createdAt &&
                        formatMessageDate(message.createdAt)}
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isSender
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={sending}
            className="flex-grow"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
