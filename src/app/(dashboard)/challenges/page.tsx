"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  MoreVertical,
  Trash2,
  Target,
  Plus,
  CheckCircle,
  Users,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChallengeDetails } from "@/components/challenges/challenge-details";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, isPast } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface Challenge {
  id: string;
  userId: string;
  title: string;
  description: string;
  endDate: any;
  isPublic: boolean;
  category: string;
  createdAt: any;
  status: string;
  participants: string[];
  milestones: any[];
}

export default function ChallengesPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("active");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(
    null
  );

  const fetchChallenges = async (status: string) => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const challengesRef = collection(db, "challenges");
      const challengesQuery = query(
        challengesRef,
        where("userId", "==", currentUser.uid),
        where("status", "==", status),
        orderBy("endDate", "asc")
      );

      const querySnapshot = await getDocs(challengesQuery);

      const challengesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Challenge[];

      setChallenges(challengesData);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchChallenges(activeTab);
    }
  }, [currentUser, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleDeleteChallenge = (challengeId: string) => {
    setChallengeToDelete(challengeId);
    setDeleteAlertOpen(true);
  };

  const confirmDeleteChallenge = async () => {
    if (!challengeToDelete || !currentUser) return;

    try {
      setDeletingId(challengeToDelete);
      await deleteDoc(doc(db, "challenges", challengeToDelete));
      setChallenges(
        challenges.filter((challenge) => challenge.id !== challengeToDelete)
      );
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error deleting challenge:", error);
    } finally {
      setDeletingId(null);
      setChallengeToDelete(null);
    }
  };

  const handleCompleteChallenge = async (challengeId: string) => {
    if (!currentUser) return;

    try {
      setDeletingId(challengeId); // Reuse the loading state
      const challengeRef = doc(db, "challenges", challengeId);
      await updateDoc(challengeRef, {
        status: "completed",
      });
      setChallenges(
        challenges.filter((challenge) => challenge.id !== challengeId)
      );
    } catch (error) {
      console.error("Error completing challenge:", error);
    } finally {
      setDeletingId(null);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Challenges</h1>
        <Link href="/challenges/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Challenge
          </Button>
        </Link>
      </div>

      <Tabs
        defaultValue="active"
        className="space-y-6"
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : challenges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No active challenges</h3>
                <p className="text-muted-foreground mt-2 mb-6">
                  Start by creating a new challenge to track your goals.
                </p>
                <Link href="/challenges/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Challenge
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <Card
                  key={challenge.id}
                  className="overflow-hidden flex flex-col"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {challenge.title}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(challenge.endDate.toDate()), "PPP")}
                        </CardDescription>
                      </div>
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
                    <p className="text-sm line-clamp-2 mb-4">
                      {challenge.description}
                    </p>

                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span>Progress</span>
                      <span>{calculateProgress(challenge)}%</span>
                    </div>
                    <Progress
                      value={calculateProgress(challenge)}
                      className="h-2 mb-4"
                    />

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{challenge.category}</Badge>
                      {challenge.isPublic && (
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="border-t pt-4 flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedChallenge(challenge)}
                    >
                      View Details
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {deletingId === challenge.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleCompleteChallenge(challenge.id)}
                          className="text-green-600 cursor-pointer"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteChallenge(challenge.id)}
                          className="text-destructive cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center p-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No completed challenges</h3>
              <p className="text-muted-foreground mt-2">
                Challenges you complete will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {challenge.title}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(challenge.endDate.toDate()), "PPP")}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm line-clamp-2 mb-4">
                      {challenge.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{challenge.category}</Badge>
                    </div>
                  </CardContent>

                  <CardFooter className="border-t pt-4 flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedChallenge(challenge)}
                    >
                      View Details
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {deletingId === challenge.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteChallenge(challenge.id)}
                          className="text-destructive cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedChallenge && (
        <ChallengeDetails
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onUpdate={() => {
            fetchChallenges(activeTab);
            setSelectedChallenge(null);
          }}
        />
      )}

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              challenge and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteChallenge}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
