"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JourneyEntryForm } from "@/components/journey/journey-entry";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentChallenges, setRecentChallenges] = useState<any[]>([]);
  const [recentJourneys, setRecentJourneys] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const challengesRef = collection(db, "challenges");
        const challengesQuery = query(
          challengesRef,
          where("userId", "==", currentUser.uid),
          where("status", "==", "active"),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const challengesSnap = await getDocs(challengesQuery);
        const challengesData: any[] = [];
        challengesSnap.forEach((doc) => {
          challengesData.push({ id: doc.id, ...doc.data() });
        });
        setRecentChallenges(challengesData);

        const journeysRef = collection(db, "journeys");
        const journeysQuery = query(
          journeysRef,
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const journeysSnap = await getDocs(journeysQuery);
        const journeysData: any[] = [];
        journeysSnap.forEach((doc) => {
          journeysData.push({ id: doc.id, ...doc.data() });
        });
        setRecentJourneys(journeysData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <JourneyEntryForm />
          {loading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Your Recent Updates</CardTitle>
                <CardDescription>
                  {" "}
                  The latest entries in your journey{" "}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentJourneys.length > 0 ? (
                  <div className="space-y-4">
                    {recentJourneys.map((journey) => (
                      <div
                        key={journey.id}
                        className="pb-4 border-b last:border-b-0"
                      >
                        <h3 className="font-medium">{journey.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {journey.content}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {journey.tags
                            .slice(0, 3)
                            .map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                    <Link href="/journeys">
                      <Button variant="outline" className="w-full">
                        {" "}
                        View All Updates{" "}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      {" "}
                      You haven't added any journey updates yet. Start
                      documenting your progress!{" "}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Active Challenges</CardTitle>
              <CardDescription>
                {" "}
                Goals you're currently working on{" "}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentChallenges.length > 0 ? (
                <div className="space-y-4">
                  {recentChallenges.map((challenge) => (
                    <div key={challenge.id} className="border rounded-lg p-3">
                      <h3 className="font-medium">{challenge.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {" "}
                        Ends:{" "}
                        {new Date(
                          challenge.endDate.toDate()
                        ).toLocaleDateString()}{" "}
                      </p>
                    </div>
                  ))}
                  <Link href="/challenges">
                    <Button variant="outline" className="w-full">
                      {" "}
                      View All Challenges{" "}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground py-3">
                    {" "}
                    You don't have any active challenges yet.{" "}
                  </p>
                  <Link href="/challenges/create">
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" /> Create Challenge
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Connect</CardTitle>
              <CardDescription>
                {" "}
                Find others with similar goals{" "}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/connect">
                <Button variant="outline" className="w-full">
                  {" "}
                  Discover Connections{" "}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
