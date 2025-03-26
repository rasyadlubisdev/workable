"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StartChatButtonProps {
  recipientId: string;
  recipientName: string | null | undefined;
}

export function StartChatButton({
  recipientId,
  recipientName,
}: StartChatButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();
  const router = useRouter();

  const handleStartChat = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);

      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      let existingChatId = null;

      querySnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.participants.includes(recipientId)) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        router.push(`/messages/${existingChatId}`);
        return;
      }

      const newChatRef = await addDoc(collection(db, "chats"), {
        participants: [currentUser.uid, recipientId],
        messages: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast(`You can now message ${recipientName}`, {
        description: "Chat started",
      });

      router.push(`/messages/${newChatRef.id}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("There was a problem starting the chat", {
        description: "Error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartChat}
      disabled={isLoading || !currentUser}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4" />
      )}
      Message
    </Button>
  );
}
