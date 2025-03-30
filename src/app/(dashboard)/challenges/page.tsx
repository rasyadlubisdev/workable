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
  getDoc,
} from "firebase/firestore";
import { Loader2, Plus, Target, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Challenge,
  ChallengeWithProgress,
  UserProgress,
} from "@/types/challenge";
import { ChallengeDetails } from "@/components/challenges/challenge-details";
import { ChallengeCard } from "@/components/challenges/challenge-card";

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

      let allChallenges: Challenge[] = [];

      const ownedChallengesRef = collection(db, "challenges");
      const ownedChallengesQuery = query(
        ownedChallengesRef,
        where("userId", "==", currentUser.uid),
        where("status", "==", status),
        orderBy("endDate", "asc")
      );

      const ownedSnap = await getDocs(ownedChallengesQuery);
      const ownedChallenges = ownedSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isOwner: true,
      })) as ChallengeWithProgress[];

      allChallenges = [...ownedChallenges];

      const participatingChallengesRef = collection(db, "challenges");
      const participatingQuery = query(
        participatingChallengesRef,
        where("participants", "array-contains", currentUser.uid),
        where("userId", "!=", currentUser.uid),
        orderBy("userId")
      );

      const participatingSnap = await getDocs(participatingQuery);

      const userProgressPromises = participatingSnap.docs.map(
        async (challengeDoc) => {
          const challengeData = challengeDoc.data();
          const progressRef = doc(
            db,
            "userProgress",
            `${currentUser.uid}_${challengeDoc.id}`
          );
          const progressSnap = await getDoc(progressRef);

          if (progressSnap.exists()) {
            const progressData = progressSnap.data() as UserProgress;

            const userStatus = progressData.status || "active";
            if (userStatus === status) {
              return {
                id: challengeDoc.id,
                ...challengeData,
                isOwner: false,
                userProgress: progressData,
              };
            }
          }
          return null;
        }
      );

      const participatedChallenges = (
        await Promise.all(userProgressPromises)
      ).filter(Boolean) as ChallengeWithProgress[];

      allChallenges = [...allChallenges, ...participatedChallenges];

      setChallenges(allChallenges);
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

  const handleChallengeUpdated = () => {
    fetchChallenges(activeTab);
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
            <div className="p-12">
              <div className="border rounded p-12 text-center">
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
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onViewDetails={() => setSelectedChallenge(challenge)}
                  onChallengeUpdated={handleChallengeUpdated}
                />
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
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onViewDetails={() => setSelectedChallenge(challenge)}
                  onChallengeUpdated={handleChallengeUpdated}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedChallenge && (
        <ChallengeDetails
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onUpdate={handleChallengeUpdated}
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
