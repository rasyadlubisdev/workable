export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: {
    text: string;
    createdAt: any;
    senderId: string;
  };
  createdAt: any;
  updatedAt: any;
}

export interface ChatWithUserDetails extends Chat {
  unreadCount: number;
  otherUser: {
    id: string;
    username: string;
    profileImage: string;
  };
}
