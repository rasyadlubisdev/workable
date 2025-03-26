"use client";

import { IntelligentMatcher } from "@/components/connect/intelligent-matcher";
import { PublicChallenges } from "@/components/connect/public-challenges";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          <IntelligentMatcher />
        </TabsContent>

        <TabsContent value="challenges">
          <PublicChallenges />
        </TabsContent>

        <TabsContent value="messages">
          <div className="text-center p-8 border rounded-lg">
            <h3 className="text-lg font-medium mb-2">
              Quick Access to Messages
            </h3>
            <p className="text-muted-foreground mb-4">
              View and manage your conversations with other users
            </p>
            <div className="flex justify-center">
              <a href="/messages">
                <Button>Go to Messages</Button>
              </a>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
