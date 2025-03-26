"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  Filter,
  UserCheck,
  UsersIcon,
  Sparkles,
} from "lucide-react";
import { StartChatButton } from "@/components/messaging/start-chat-button";
import Link from "next/link";

interface UserProfile {
  id: string;
  username: string;
  bio: string;
  goal: string;
  interests: string[];
  profileImage: string;
  matchScore?: number;
  commonInterests?: string[];
}

export function IntelligentMatcher() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [potentialMatches, setPotentialMatches] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchMatches = async () => {
      try {
        setLoading(true);

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.error("User document doesn't exist");
          return;
        }

        const userData = userSnap.data();
        setCurrentUserData(userData);

        const usersRef = collection(db, "users");
        const usersQuery = query(
          usersRef,
          where("__name__", "!=", currentUser.uid)
        );
        const usersSnap = await getDocs(usersQuery);

        const journeysRef = collection(db, "journeys");
        const journeysData = new Map();

        const users: UserProfile[] = [];

        for (const userDoc of usersSnap.docs) {
          const data = userDoc.data();

          const userJourneysQuery = query(
            journeysRef,
            where("userId", "==", userDoc.id),
            limit(50)
          );
          const userJourneys = await getDocs(userJourneysQuery);

          const userInterests = data.interests || [];
          const myInterests = userData.interests || [];
          const commonInterests = userInterests.filter((interest: string) =>
            myInterests.includes(interest)
          );

          const challengesRef = collection(db, "challenges");
          const challengesQuery = query(
            challengesRef,
            where("userId", "==", userDoc.id),
            limit(20)
          );
          const challenges = await getDocs(challengesQuery);

          let matchScore = 0;

          matchScore +=
            (commonInterests.length / Math.max(myInterests.length, 1)) * 50;

          matchScore += Math.min(userJourneys.size / 10, 1) * 20;

          if (data.goal && userData.goal) {
            const goalSimilarity = calculateTextSimilarity(
              data.goal,
              userData.goal
            );
            matchScore += goalSimilarity * 15;
          }

          const profileCompleteness = calculateProfileCompleteness(data);
          matchScore += profileCompleteness * 15;

          users.push({
            id: userDoc.id,
            username: data.username || "User",
            bio: data.bio || "",
            goal: data.goal || "",
            interests: data.interests || [],
            profileImage: data.profileImage || "",
            matchScore: Math.round(matchScore),
            commonInterests,
          });
        }

        users.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

        setPotentialMatches(users);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [currentUser]);

  const calculateTextSimilarity = (text1: string, text2: string) => {
    const words1 = text1.toLowerCase().split(/\W+/);
    const words2 = text2.toLowerCase().split(/\W+/);

    const commonWords = words1.filter((word) => words2.includes(word));
    const unionCount = new Set([...words1, ...words2]).size;

    return commonWords.length / unionCount;
  };

  const calculateProfileCompleteness = (profile: any) => {
    let score = 0;

    if (profile.username) score += 0.2;
    if (profile.bio && profile.bio.length > 20) score += 0.3;
    if (profile.goal) score += 0.2;
    if (profile.interests && profile.interests.length > 0) score += 0.2;
    if (profile.profileImage) score += 0.1;

    return score;
  };

  const getMatchDescription = (score: number) => {
    if (score >= 80) return "Exceptional Match";
    if (score >= 60) return "Great Match";
    if (score >= 40) return "Good Match";
    if (score >= 20) return "Fair Match";
    return "Basic Match";
  };

  const filteredMatches = potentialMatches.filter((match) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      match.username.toLowerCase().includes(query) ||
      match.bio.toLowerCase().includes(query) ||
      match.goal.toLowerCase().includes(query) ||
      match.interests.some((interest) => interest.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for potential connections..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <UsersIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">
            No potential matches found
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try a different search term or check back later."
              : "Try updating your profile with more interests and goals."}
          </p>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-medium flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
            Smart Recommendations
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connections sorted by compatibility with your interests, goals, and
            activity
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMatches.map((match) => (
              <Card key={match.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <Link
                      href={`/profile/${match.id}`}
                      className="flex items-start gap-3"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={match.profileImage}
                          alt={match.username}
                        />
                        <AvatarFallback>
                          {match.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {match.username}
                        </CardTitle>
                        <CardDescription>
                          {match.goal || "No goal specified"}
                        </CardDescription>
                      </div>
                    </Link>

                    <Badge
                      className={
                        (match.matchScore || 0) >= 60 ? "bg-green-500" : ""
                      }
                      variant={
                        (match.matchScore || 0) >= 60 ? "default" : "secondary"
                      }
                    >
                      {match.matchScore}% Match
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="text-xs text-muted-foreground uppercase font-medium mb-1">
                    {getMatchDescription(match.matchScore || 0)}
                  </div>

                  <p className="text-sm line-clamp-2 min-h-[40px] mb-2">
                    {match.bio || "No bio available"}
                  </p>

                  {match.commonInterests &&
                    match.commonInterests.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-muted-foreground mb-1">
                          Common Interests:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {match.commonInterests.map((interest, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {match.interests
                      .filter(
                        (interest) => !match.commonInterests?.includes(interest)
                      )
                      .slice(0, 3)
                      .map((interest, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {interest}
                        </Badge>
                      ))}
                    {match.interests.length -
                      (match.commonInterests?.length || 0) >
                      3 && (
                      <Badge variant="secondary" className="text-xs">
                        +
                        {match.interests.length -
                          (match.commonInterests?.length || 0) -
                          3}
                      </Badge>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-4 flex gap-2">
                  <Link href={`/profile/${match.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      View Profile
                    </Button>
                  </Link>
                  <StartChatButton
                    recipientId={match.id}
                    recipientName={match.username}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
