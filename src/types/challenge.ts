export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  createdAt?: any;
}

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
  milestones: Milestone[];
  creatorName?: string;
  creatorImage?: string;
  goal?: string;
  interests?: string[];
  commonInterests?: string[];
  matchScore: number;
  bio: string;
  invitationCode: string;
  updatedAt?: any;
  isOwner: boolean;
}

export interface UserProgress {
  userId: string;
  challengeId: string;
  milestones: Milestone[];
  lastUpdated: any;
  joinedAt: any;
}

export interface ChallengeWithProgress extends Challenge {
  userProgress?: UserProgress;
  isOwner: boolean;
}
