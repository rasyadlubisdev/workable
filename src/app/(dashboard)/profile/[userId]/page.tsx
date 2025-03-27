"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Mail, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { JourneyCard } from "@/components/journey/journey-card";
import Link from "next/link";
import { toast } from "sonner";
import { PublicProfile } from "../public-profile";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = React.use(params);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [journeysLoading, setJourneysLoading] = useState(true);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isOwnProfile = currentUser?.uid === userId;

  useEffect(() => {
    if (isOwnProfile) {
      router.replace("/profile");
      return;
    }

    fetchUserData();
  }, [userId, currentUser, isOwnProfile, router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        setError("User not found");
        return;
      }

      setUserData(userDoc.data());

      fetchJourneys();

      fetchChallenges();
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("There was a problem loading this profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchJourneys = async () => {
    try {
      setJourneysLoading(true);

      const journeysRef = collection(db, "journeys");
      const journeysQuery = query(
        journeysRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(journeysQuery);

      const journeyEntries = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        username: userData?.username,
        profileImage: userData?.profileImage,
      }));

      setJourneys(journeyEntries);
    } catch (error) {
      console.error("Error fetching journeys:", error);
    } finally {
      setJourneysLoading(false);
    }
  };

  const fetchChallenges = async () => {
    try {
      setChallengesLoading(true);

      const challengesRef = collection(db, "challenges");
      const challengesQuery = query(
        challengesRef,
        where("userId", "==", userId),
        where("isPublic", "==", true),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(challengesQuery);

      const challengeEntries = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setChallenges(challengeEntries);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setChallengesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="px-0 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <PublicProfile userId={userId} userData={userData} />
      </div>

      <Tabs defaultValue="journeys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="journeys">Journey Updates</TabsTrigger>
          <TabsTrigger value="challenges">Public Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="journeys" className="space-y-4">
          {journeysLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : journeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No journey updates to show.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {journeys.map((journey) => (
                <JourneyCard
                  key={journey.id}
                  journey={journey}
                  onView={() => {}}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          {challengesLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No public challenges to show.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        {challenge.title}
                      </CardTitle>
                      <Badge>{challenge.category}</Badge>
                    </div>
                    <CardDescription>
                      {challenge.createdAt &&
                        format(new Date(challenge.createdAt.toDate()), "PP")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-3 mb-3">
                      {challenge.description}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      Ends{" "}
                      {challenge.endDate &&
                        format(new Date(challenge.endDate.toDate()), "PP")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
