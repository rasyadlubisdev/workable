"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface ConnectionsDisplayProps {
  userId: string;
}

export function ConnectionsDisplay({ userId }: ConnectionsDisplayProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connectionCount, setConnectionCount] = useState(0);
  const [recentConnections, setRecentConnections] = useState<any[]>([]);

  useEffect(() => {
    const connectionsRef = doc(db, "connections", userId);
    const unsubscribe = onSnapshot(connectionsRef, (doc) => {
      if (doc.exists()) {
        setConnectionCount(doc.data().connectionCount || 0);
      } else {
        setConnectionCount(0);
      }
    });

    fetchRecentConnections();

    return () => unsubscribe();
  }, [userId]);

  const fetchRecentConnections = async () => {
    try {
      setLoading(true);

      const connectionsRef = doc(db, "connections", userId);
      const connectionsSnapshot = await getDoc(connectionsRef);

      if (
        !connectionsSnapshot.exists() ||
        !connectionsSnapshot.data().connected
      ) {
        setRecentConnections([]);
        setLoading(false);
        return;
      }

      const connectedIds = connectionsSnapshot.data().connected || [];

      const limitedIds = connectedIds.slice(0, 6);

      if (limitedIds.length === 0) {
        setRecentConnections([]);
        setLoading(false);
        return;
      }

      const connectionsData = await Promise.all(
        limitedIds.map(async (id: string) => {
          const userDoc = await getDoc(doc(db, "users", id));
          if (userDoc.exists()) {
            return {
              id,
              ...userDoc.data(),
            };
          }
          return null;
        })
      );

      setRecentConnections(connectionsData.filter(Boolean));
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Connections</h3>
        <Badge variant="outline">{connectionCount}</Badge>
      </div>

      {recentConnections.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-4">
          {userId === currentUser?.uid
            ? "You haven't connected with anyone yet."
            : "No connections to display."}
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {recentConnections.map((connection) => (
            <Link
              href={`/profile/${connection.id}`}
              key={connection.id}
              className="flex flex-col items-center text-center"
            >
              <Avatar className="h-12 w-12 mb-1">
                <AvatarImage src={connection.profileImage} />
                <AvatarFallback>
                  {connection.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate max-w-full">
                {connection.username}
              </span>
            </Link>
          ))}

          {connectionCount > 6 && (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <div className="flex items-center justify-center h-12 w-12 rounded-full border mb-1">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-xs">{connectionCount - 6} more</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
