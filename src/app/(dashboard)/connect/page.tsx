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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="people">
          <IntelligentMatcher />
        </TabsContent>

        <TabsContent value="challenges">
          <PublicChallenges />
        </TabsContent>
      </Tabs>
    </div>
  );
}
