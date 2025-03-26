"use client";
import { ProfileForm } from "@/components/profile/profile-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [journeysLoading, setJourneysLoading] = useState(true);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [recentJourneys, setRecentJourneys] = useState<any[]>([]);
  const [recentChallenges, setRecentChallenges] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchUserData = async () => {
      try {
        setJourneysLoading(true);
        const journeysRef = collection(db, "journeys");
        const journeysQuery = query(
          journeysRef,
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const journeysSnap = await getDocs(journeysQuery);
        const journeysData: any[] = [];
        journeysSnap.forEach((doc) => {
          journeysData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setRecentJourneys(journeysData);
        setJourneysLoading(false);

        setChallengesLoading(true);
        const challengesRef = collection(db, "challenges");
        const challengesQuery = query(
          challengesRef,
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const challengesSnap = await getDocs(challengesQuery);
        const challengesData: any[] = [];
        challengesSnap.forEach((doc) => {
          challengesData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setRecentChallenges(challengesData);
        setChallengesLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setJourneysLoading(false);
        setChallengesLoading(false);
      }
    };
    fetchUserData();
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
      <Tabs defaultValue="edit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="edit">Edit Profile</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio View</TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="space-y-4">
          <ProfileForm />
        </TabsContent>
        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Journey Updates</CardTitle>
              <CardDescription>
                {" "}
                Documenting your progress and milestones{" "}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {journeysLoading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentJourneys.length > 0 ? (
                <div className="space-y-4">
                  {recentJourneys.map((journey) => (
                    <div
                      key={journey.id}
                      className="border-b pb-4 last:border-none"
                    >
                      <h3 className="font-semibold">{journey.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {" "}
                        {new Date(
                          journey.createdAt?.toDate()
                        ).toLocaleDateString()}{" "}
                      </p>
                      <p className="mt-2">{journey.content}</p>
                      {journey.imageURL && (
                        <div className="mt-3 rounded-md overflow-hidden">
                          <img
                            src={journey.imageURL}
                            alt={journey.title}
                            className="max-h-[200px] object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  {" "}
                  You haven't added any journey updates yet.{" "}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Your Challenges</CardTitle>
              <CardDescription>
                {" "}
                Goals and missions you've set for yourself{" "}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {challengesLoading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentChallenges.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {recentChallenges.map((challenge) => (
                    <div key={challenge.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{challenge.title}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            challenge.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {challenge.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {" "}
                        {new Date(
                          challenge.createdAt?.toDate()
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          challenge.endDate?.toDate()
                        ).toLocaleDateString()}{" "}
                      </p>
                      <p className="mt-2 text-sm line-clamp-2">
                        {challenge.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  {" "}
                  You haven't created any challenges yet.{" "}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
