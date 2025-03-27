import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format, isPast } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import {
  Loader2,
  CalendarIcon,
  Target,
  CheckCircle,
  X,
  UserPlus,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ChallengeDetailModalProps {
  challenge: any;
  onClose: () => void;
  onJoin?: () => void;
}

export function ChallengeDetailModal({
  challenge,
  onClose,
  onJoin,
}: ChallengeDetailModalProps) {
  const { currentUser } = useAuth();
  const [joining, setJoining] = useState(false);

  const isParticipant = challenge.participants.includes(currentUser?.uid || "");

  const calculateProgress = () => {
    if (!challenge.milestones || challenge.milestones.length === 0) return 0;

    const completedMilestones = challenge.milestones.filter(
      (m: any) => m.completed
    ).length;
    return Math.round(
      (completedMilestones / challenge.milestones.length) * 100
    );
  };

  const getTimeLeft = () => {
    if (!challenge.endDate) return "No deadline";
    const end = new Date(challenge.endDate.toDate());
    const now = new Date();

    if (isPast(end)) return "Expired";

    const diffTime = Math.abs(end.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day left";
    return `${diffDays} days left`;
  };

  const handleJoinChallenge = async () => {
    if (!currentUser) return;

    try {
      setJoining(true);

      const challengeRef = doc(db, "challenges", challenge.id);
      const challengeDoc = await getDoc(challengeRef);

      if (!challengeDoc.exists()) {
        toast.error("Challenge not found.", {
          description: "Error",
        });
        return;
      }

      await updateDoc(challengeRef, {
        participants: arrayUnion(currentUser.uid),
      });

      toast.success(`You've joined "${challenge.title}"`, {
        description: "Success!",
      });

      if (onJoin) {
        onJoin();
      }

      onClose();
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast.error("There was a problem joining the challenge.", {
        description: "Error",
      });
    } finally {
      setJoining(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{challenge.title}</DialogTitle>
            <Badge variant="secondary">{challenge.category}</Badge>
          </div>
          <DialogDescription>
            Created by {challenge.creatorName || "Unknown User"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Due{" "}
              {challenge.endDate &&
                format(new Date(challenge.endDate.toDate()), "PP")}
            </Badge>
            <Badge
              variant={
                isPast(new Date(challenge.endDate.toDate()))
                  ? "destructive"
                  : "outline"
              }
            >
              {getTimeLeft()}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              {challenge.participants.length} participants
            </Badge>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-1">Description</h3>
            <p className="text-sm whitespace-pre-wrap">
              {challenge.description}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-1">Progress</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>{calculateProgress()}% complete</span>
                <span>
                  {challenge.milestones?.filter((m: any) => m.completed)
                    .length || 0}
                  /{challenge.milestones?.length || 0} milestones
                </span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          </div>

          {challenge.milestones && challenge.milestones.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Milestones</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                {challenge.milestones.map((milestone: any, index: number) => (
                  <div
                    key={milestone.id || index}
                    className="flex items-center gap-2 p-2 border rounded-md bg-card"
                  >
                    {milestone.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                    )}
                    <span
                      className={`text-sm ${
                        milestone.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {milestone.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            Close
          </Button>

          {isParticipant ? (
            <Link href="/challenges">
              <Button variant="default" className="gap-2">
                <Target className="h-4 w-4" />
                View in My Challenges
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleJoinChallenge}
              disabled={joining}
              className="gap-2"
            >
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Join Challenge
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
