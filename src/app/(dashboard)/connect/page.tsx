"use client";
import { MatchFinder } from "@/components/connect/match-finder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function ConnectPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Connect</h1>
      <Tabs defaultValue="people" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="people">
          <Card>
            <CardHeader>
              <CardTitle>Find Potential Connections</CardTitle>
              <CardDescription>
                {" "}
                Discover people with similar interests and goals{" "}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MatchFinder />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="challenges">
          <Card>
            <CardHeader>
              <CardTitle>Join Challenges</CardTitle>
              <CardDescription>
                {" "}
                Find public challenges to participate in{" "}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-10">
                {" "}
                Challenge discovery feature coming soon!{" "}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                {" "}
                Connect and communicate with your network{" "}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-10">
                {" "}
                Messaging feature coming soon!{" "}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
