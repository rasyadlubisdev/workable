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
  updateDoc,
  limit,
  deleteDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
  UserPlus,
  Clock,
  MessageSquare,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { Notification } from "@/types/notification";
import { useRouter } from "next/navigation";

export function NotificationsPopover() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: Notification[] = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const data = doc.data() as Notification;
        const { id: ignored, ...rest } = data;
        notificationsList.push({
          id: doc.id,
          ...rest,
        });

        if (!data.read) {
          unread++;
        }
      });

      setNotifications(notificationsList);
      setUnreadCount(unread);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (notificationId: string) => {
    if (!currentUser) return;

    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;

    try {
      setMarkingAllAsRead(true);

      const batch = writeBatch(db);

      notifications.forEach((notification) => {
        if (!notification.read) {
          const notificationRef = doc(db, "notifications", notification.id);
          batch.update(notificationRef, { read: true });
        }
      });

      await batch.commit();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const clearAllNotifications = async () => {
    if (!currentUser || notifications.length === 0) return;

    try {
      setClearingAll(true);

      const batch = writeBatch(db);

      notifications.forEach((notification) => {
        const notificationRef = doc(db, "notifications", notification.id);
        batch.delete(notificationRef);
      });

      await batch.commit();
    } catch (error) {
      console.error("Error clearing all notifications:", error);
    } finally {
      setClearingAll(false);
    }
  };

  const handleAction = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setOpen(false);
    }
  };

  const deleteNotification = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatNotificationDate = (timestamp: Timestamp) => {
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "connect":
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case "challenge":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "message":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 rounded-full"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[360px]" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || markingAllAsRead}
            >
              {markingAllAsRead ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0 || clearingAll}
            >
              {clearingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <Separator />

        {loading ? (
          <div className="py-8 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleAction(notification)}
                  className={`p-4 hover:bg-muted/50 cursor-pointer flex gap-4 ${
                    !notification.read ? "bg-muted/30" : ""
                  }`}
                >
                  {notification.senderImage ? (
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={notification.senderImage}
                        alt={notification.senderName || ""}
                      />
                      <AvatarFallback>
                        {notification.senderName?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            !notification.read
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatNotificationDate(notification.createdAt)}
                        </span>
                        <button
                          onClick={(e) =>
                            deleteNotification(notification.id, e)
                          }
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {notification.actionLabel && (
                      <Button
                        variant="link"
                        className="px-0 py-0 h-auto text-xs"
                      >
                        {notification.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
