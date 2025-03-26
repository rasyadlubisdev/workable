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
  limit,
  orderBy,
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
import { Loader2, Search } from "lucide-react";

type UserProfile = {
  id: string;
  username: string;
  bio: string;
  goal: string;
  interests: string[];
  profileImage: string;
};

export function MatchFinder() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    async function fetchMatches() {
      try {
        setLoading(true);

        if (!currentUser) {
          setLoading(false);
          return;
        }
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;
        const userData = userSnap.data();
        const userInterests = userData.interests || [];

        const usersRef = collection(db, "users");
        const matchesQuery = query(
          usersRef,
          where("interests", "array-contains-any", userInterests),
          limit(10)
        );
        const matchesSnap = await getDocs(matchesQuery);
        const matchesData: UserProfile[] = [];
        matchesSnap.forEach((doc) => {
          const data = doc.data();
          if (doc.id !== currentUser?.uid) {
            matchesData.push({
              id: doc.id,
              username: data.username,
              bio: data.bio || "",
              goal: data.goal || "",
              interests: data.interests || [],
              profileImage: data.profileImage || "",
            });
          }
        });
        setMatches(matchesData);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [currentUser]);

  const filteredMatches = matches.filter((match) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      match.username.toLowerCase().includes(query) ||
      match.bio.toLowerCase().includes(query) ||
      match.goal.toLowerCase().includes(query) ||
      match.interests.some((interest) => interest.toLowerCase().includes(query))
    );
  });

  const handleConnectClick = (userId: string) => {
    console.log("Connect with user:", userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for users by name, interest, or goal..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMatches.length === 0 ? (
          <div className="col-span-2 text-center py-10">
            <p className="text-muted-foreground">
              {searchQuery
                ? "No matches found for your search. Try different keywords."
                : "No potential matches found. Try updating your interests in your profile."}
            </p>
          </div>
        ) : (
          filteredMatches.map((match) => (
            <Card key={match.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={match.profileImage}
                      alt={match.username}
                    />
                    <AvatarFallback>
                      {" "}
                      {match.username[0]?.toUpperCase() || "U"}{" "}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{match.username}</CardTitle>
                    <CardDescription className="line-clamp-1 mt-1">
                      {" "}
                      {match.goal || "No goal specified"}{" "}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-2 min-h-[40px]">
                  {" "}
                  {match.bio || "No bio available"}{" "}
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {match.interests.slice(0, 5).map((interest, index) => (
                    <Badge key={index} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                  {match.interests.length > 5 && (
                    <Badge variant="outline">
                      +{match.interests.length - 5}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => handleConnectClick(match.id)}
                >
                  Connect
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
