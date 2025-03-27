"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  increment,
  onSnapshot,
} from "firebase/firestore";
import { Loader2, UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface ConnectButtonProps {
  userId: string;
}

export function ConnectButton({ userId }: ConnectButtonProps) {
  const { currentUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const checkConnection = async () => {
      try {
        const myConnectionsRef = doc(db, "connections", currentUser.uid);
        const docSnap = await getDoc(myConnectionsRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsConnected(data.connected?.includes(userId) || false);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    };

    const userConnectionsRef = doc(db, "connections", userId);
    const unsubscribe = onSnapshot(userConnectionsRef, (docSnap) => {
      if (docSnap.exists()) {
        setConnectionCount(docSnap.data().connectionCount || 0);
      } else {
        setConnectionCount(0);
      }
    });

    checkConnection();

    return () => unsubscribe();
  }, [currentUser, userId]);

  const handleToggleConnection = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);

      const myConnectionsRef = doc(db, "connections", currentUser.uid);
      const theirConnectionsRef = doc(db, "connections", userId);

      const myDocSnap = await getDoc(myConnectionsRef);
      if (!myDocSnap.exists()) {
        await setDoc(myConnectionsRef, {
          connected: [],
          connectionCount: 0,
          updatedAt: serverTimestamp(),
        });
      }

      const theirDocSnap = await getDoc(theirConnectionsRef);
      if (!theirDocSnap.exists()) {
        await setDoc(theirConnectionsRef, {
          connected: [],
          connectionCount: 0,
          updatedAt: serverTimestamp(),
        });
      }

      if (isConnected) {
        await updateDoc(myConnectionsRef, {
          connected: arrayRemove(userId),
          updatedAt: serverTimestamp(),
        });

        await updateDoc(theirConnectionsRef, {
          connectionCount: increment(-1),
          updatedAt: serverTimestamp(),
        });

        setIsConnected(false);
        toast("You are no longer connected with this user.", {
          description: "Disconnected",
        });
      } else {
        await updateDoc(myConnectionsRef, {
          connected: arrayUnion(userId),
          updatedAt: serverTimestamp(),
        });

        await updateDoc(theirConnectionsRef, {
          connectionCount: increment(1),
          updatedAt: serverTimestamp(),
        });

        setIsConnected(true);
        toast.success("You are now connected with this user.", {
          description: "Connected!",
        });
      }
    } catch (error) {
      console.error("Error toggling connection:", error);
      toast.error("Failed to update connection. Please try again.", {
        description: "Error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Button
      variant={isConnected ? "outline" : "default"}
      className="gap-2"
      onClick={handleToggleConnection}
      disabled={isLoading || currentUser.uid === userId}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isConnected ? (
        <>
          <UserCheck className="h-4 w-4" />
          Connected
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Connect
        </>
      )}
    </Button>
  );
}
