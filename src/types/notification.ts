export interface Notification {
  id: string;
  userId: string;
  type: "connect" | "challenge" | "message" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  actionUrl?: string;
  actionLabel?: string;
  senderId?: string;
  senderName?: string;
  senderImage?: string;
}
