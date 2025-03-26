"use client";

import { ChallengeForm } from "@/components/challenges/challenge-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateChallengePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/challenges"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Challenges
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">
        Create New Challenge
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ChallengeForm />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Challenge Tips</CardTitle>
              <CardDescription>
                How to create effective challenges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Be Specific</h3>
                <p className="text-sm text-muted-foreground">
                  Clear goals are easier to achieve. "Read 10 books" is better
                  than "Read more."
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Set Realistic Timeframes</h3>
                <p className="text-sm text-muted-foreground">
                  Choose deadlines that push you but are still achievable with
                  consistent effort.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Add Milestones</h3>
                <p className="text-sm text-muted-foreground">
                  Break your challenge into smaller steps to track progress and
                  stay motivated.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Make It Public</h3>
                <p className="text-sm text-muted-foreground">
                  Sharing your challenge can help you find accountability
                  partners and stay committed.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Challenge Ideas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">• 30 days of consistent exercise</p>
              <p className="text-sm">• Learn a new programming language</p>
              <p className="text-sm">• Read 12 books in a year</p>
              <p className="text-sm">• Complete an online course</p>
              <p className="text-sm">• Build a portfolio project</p>
              <p className="text-sm">• Practice daily meditation</p>
              <p className="text-sm">• Master a skill in your field</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
