export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  endDate: any;
  createdAt: any;
  status: string;
  isPublic: boolean;
  userId: string;
  participants: string[];
  milestones: any[];
  creatorName?: string;
  creatorImage?: string;
  goal?: string;
  interests?: string[];
  commonInterests?: string[];
  matchScore: number;
  bio: string;
}
