import { Timestamp } from "firebase/firestore";

export interface Comment {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  text: string;
  createdAt: Timestamp;
}

export interface Journey {
  id?: string;
  userId: string;
  title: string;
  content: string;
  imageURL?: string;
  tags: string[];
  likes: number;
  likedBy: string[];
  comments: Comment[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isEdited?: boolean;
}
