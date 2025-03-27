"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
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
  UsersIcon,
  CalendarIcon,
  Sparkles,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { JoinChallengeModal } from "@/components/challenges/join-challenge-modal";
import Link from "next/link";
import { Challenge } from "@/types/challenge";
import { StartChatButton } from "../messaging/start-chat-button";
import { ChallengeDetailModal } from "@/components/connect/challenge-detail-modal";

export function PublicChallenges() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [lastVisible, setLastVisible] = useState<
    QueryDocumentSnapshot | undefined
  >(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );

  useEffect(() => {
    if (currentUser) {
      fetchChallenges();
    }
  }, [currentUser]);

  const fetchChallenges = async (startAfterDoc?: QueryDocumentSnapshot) => {
    if (!currentUser) return;

    try {
      if (startAfterDoc) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setChallenges([]);
      }

      const challengesRef = collection(db, "challenges");
      let challengesQuery;

      if (startAfterDoc) {
        challengesQuery = query(
          challengesRef,
          where("isPublic", "==", true),
          where("status", "==", "active"),
          where("userId", "!=", currentUser.uid),
          orderBy("userId"),
          orderBy("createdAt", "desc"),
          startAfter(startAfterDoc),
          limit(10)
        );
      } else {
        challengesQuery = query(
          challengesRef,
          where("isPublic", "==", true),
          where("status", "==", "active"),
          where("userId", "!=", currentUser.uid),
          orderBy("userId"),
          orderBy("createdAt", "desc"),
          limit(10)
        );
      }

      const querySnapshot = await getDocs(challengesQuery);

      if (querySnapshot.docs.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }

      const challengesWithCreators = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as Challenge;
          const userDoc = await getDoc(doc(db, "users", data.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data() as {
              username?: string;
              profileImage?: string;
            };
            const { id: _ignored, ...rest } = data;
            return {
              id: docSnap.id,
              ...rest,
              creatorName: userData.username || "Unknown User",
              creatorImage: userData.profileImage || "",
            };
          }

          const { id: _ignored, ...rest } = data;
          return {
            id: docSnap.id,
            ...rest,
            creatorName: "Unknown User",
            creatorImage: "",
          };
        })
      );

      if (startAfterDoc) {
        setChallenges((prev) => [...prev, ...challengesWithCreators]);
      } else {
        setChallenges(challengesWithCreators);
      }
    } catch (error) {
      console.error("Error fetching public challenges:", error);
      toast.error("There was a problem loading challenges.", {
        description: "Error",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!currentUser) return;

    try {
      setJoiningId(challengeId);

      const challengeRef = doc(db, "challenges", challengeId);
      const challengeDoc = await getDoc(challengeRef);

      if (!challengeDoc.exists()) {
        toast.error("Challenge not found.", {
          description: "Error",
        });
        return;
      }

      const challengeData = challengeDoc.data();

      if (
        challengeData.participants &&
        challengeData.participants.includes(currentUser.uid)
      ) {
        toast("You are already a participant in this challenge.", {
          description: "Already joined",
        });
        return;
      }

      await updateDoc(challengeRef, {
        participants: arrayUnion(currentUser.uid),
      });

      toast.success(`You've joined "${challengeData.title}"`, {
        description: "Success!",
      });

      setChallenges((prev) =>
        prev.map((challenge) =>
          challenge.id === challengeId
            ? {
                ...challenge,
                participants: [...challenge.participants, currentUser.uid],
              }
            : challenge
        )
      );
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast.error("There was a problem joining the challenge.", {
        description: "Error",
      });
    } finally {
      setJoiningId(null);
    }
  };

  const calculateProgress = (challenge: Challenge) => {
    if (!challenge.milestones || challenge.milestones.length === 0) return 0;

    const completedMilestones = challenge.milestones.filter(
      (m) => m.completed
    ).length;
    return Math.round(
      (completedMilestones / challenge.milestones.length) * 100
    );
  };

  const getTimeLeft = (endDate: any) => {
    if (!endDate) return "No deadline";
    const end = new Date(endDate.toDate());
    const now = new Date();

    if (isPast(end)) return "Expired";

    const diffTime = Math.abs(end.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day left";
    return `${diffDays} days left`;
  };

  const filteredChallenges = challenges.filter((challenge) => {
    if (!searchQuery) return true;

    const queryText = searchQuery.toLowerCase();
    return (
      challenge.title.toLowerCase().includes(queryText) ||
      challenge.description.toLowerCase().includes(queryText) ||
      challenge.category.toLowerCase().includes(queryText) ||
      challenge.creatorName?.toLowerCase().includes(queryText)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for challenges..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <JoinChallengeModal />
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <UsersIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">
            No public challenges found
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try a different search term or check back later."
              : "There are no public challenges available at the moment."}
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
            {filteredChallenges.map((challenge) => {
              const isParticipant = challenge.participants.includes(
                currentUser?.uid || ""
              );

              return (
                <Card
                  key={challenge.id}
                  className="overflow-hidden flex flex-col"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">
                        {challenge.title}
                      </CardTitle>
                      <Badge
                        variant={
                          isPast(new Date(challenge.endDate.toDate()))
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {getTimeLeft(challenge.endDate)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <CalendarIcon className="h-3 w-3" />
                      <span>
                        Due {format(new Date(challenge.endDate.toDate()), "PP")}
                      </span>
                    </div>

                    <p className="text-sm line-clamp-2 mb-3">
                      {challenge.description}
                    </p>

                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span>Progress</span>
                      <span>{calculateProgress(challenge)}%</span>
                    </div>
                    <Progress
                      value={calculateProgress(challenge)}
                      className="h-2 mb-3"
                    />

                    <div className="flex items-center text-sm text-muted-foreground">
                      <UsersIcon className="h-3 w-3 mr-1" />
                      {challenge.participants.length}{" "}
                      {challenge.participants.length === 1
                        ? "participant"
                        : "participants"}
                    </div>
                  </CardContent>

                  <CardFooter className="border-t pt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedChallenge(challenge)}
                    >
                      View Details
                    </Button>

                    <Button
                      className="flex-1"
                      variant={isParticipant ? "outline" : "default"}
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={joiningId === challenge.id || isParticipant}
                    >
                      {joiningId === challenge.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : isParticipant ? (
                        "Joined"
                      ) : (
                        "Join Challenge"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          {hasMore && (
            <Button
              variant="outline"
              onClick={() => fetchChallenges(lastVisible)}
              disabled={loadingMore}
              className="w-full mt-4"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading more...
                </>
              ) : (
                "Load More Challenges"
              )}
            </Button>
          )}
        </>
      )}

      {selectedChallenge && (
        <ChallengeDetailModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onJoin={() => {
            fetchChallenges();
            setSelectedChallenge(null);
          }}
        />
      )}
    </div>
  );
}
