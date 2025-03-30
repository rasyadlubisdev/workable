import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChallengeWithProgress } from "@/types/challenge";
import { format, isPast } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  MoreVertical,
  Trash2,
  CheckCircle,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";

interface ChallengeCardProps {
  challenge: ChallengeWithProgress;
  onViewDetails: () => void;
  onChallengeUpdated: () => void;
}

export function ChallengeCard({
  challenge,
  onViewDetails,
  onChallengeUpdated,
}: ChallengeCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const calculateProgress = () => {
    if (challenge.isOwner) {
      if (!challenge.milestones || challenge.milestones.length === 0) return 0;
      const completedMilestones = challenge.milestones.filter(
        (m) => m.completed
      ).length;
      return Math.round(
        (completedMilestones / challenge.milestones.length) * 100
      );
    } else {
      if (
        !challenge.userProgress?.milestones ||
        challenge.userProgress.milestones.length === 0
      )
        return 0;
      const completedMilestones = challenge.userProgress.milestones.filter(
        (m) => m.completed
      ).length;
      return Math.round(
        (completedMilestones / challenge.userProgress.milestones.length) * 100
      );
    }
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

  const handleCompleteChallenge = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);

      const challengeRef = doc(db, "challenges", challenge.id);
      await updateDoc(challengeRef, {
        status: "completed",
      });

      toast.success("Congratulations on completing your challenge!", {
        description: "Challenge completed",
      });

      onChallengeUpdated();
    } catch (error) {
      console.error("Error completing challenge:", error);
      toast.error("There was a problem updating the challenge.", {
        description: "Error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveChallenge = async () => {
    if (!currentUser || challenge.isOwner) return;

    try {
      setIsLoading(true);

      await deleteDoc(
        doc(db, "userProgress", `${currentUser.uid}_${challenge.id}`)
      );

      const challengeRef = doc(db, "challenges", challenge.id);
      await updateDoc(challengeRef, {
        participants: challenge.participants.filter(
          (id) => id !== currentUser.uid
        ),
      });

      toast("You have successfully left this challenge.", {
        description: "Left challenge",
      });

      onChallengeUpdated();
    } catch (error) {
      console.error("Error leaving challenge:", error);
      toast.error("There was a problem leaving the challenge.", {
        description: "Error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChallenge = async () => {
    if (!currentUser || !challenge.isOwner) return;

    try {
      setIsLoading(true);

      await deleteDoc(doc(db, "challenges", challenge.id));

      toast("The challenge has been deleted successfully.", {
        description: "Challenge deleted",
      });

      onChallengeUpdated();
    } catch (error) {
      console.error("Error deleting challenge:", error);
      toast.error("There was a problem deleting the challenge.", {
        description: "Error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = () => {
    if (challenge.isOwner) {
      return challenge.status;
    } else {
      return challenge.userProgress?.status || "active";
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <div className="card-challenge">
          <div>
            <div className="flex gap-2 mb-2">
              {challenge.isOwner && (
                <span className="text-yellow-500">
                  <Crown className="h-4 w-4 mt-1" />
                </span>
              )}
              <CardTitle className="text-lg">{challenge.title}</CardTitle>
            </div>
            <CardDescription>
              {format(new Date(challenge.endDate.toDate()), "PPP")}
            </CardDescription>
            <Badge
              variant={
                isPast(new Date(challenge.endDate.toDate()))
                  ? "destructive"
                  : getStatusLabel() === "completed"
                  ? "outline"
                  : "default"
              }
              className={
                getStatusLabel() === "completed"
                  ? "bg-green-100 text-green-800 border-green-300"
                  : ""
              }
            >
              {getStatusLabel() === "completed" ? "Completed" : getTimeLeft()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-sm line-clamp-2 mb-4">{challenge.description}</p>

        <div className="flex items-center justify-between mb-2 text-sm">
          <span>Progress</span>
          <span>{calculateProgress()}%</span>
        </div>
        <Progress value={calculateProgress()} className="h-2 mb-4" />

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{challenge.category}</Badge>
          {challenge.isPublic && <Badge variant="outline">Public</Badge>}
          {!challenge.isOwner && <Badge variant="outline">Joined</Badge>}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 flex justify-between">
        <Button variant="outline" size="sm" onClick={onViewDetails}>
          View Details
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {challenge.status === "active" && challenge.isOwner && (
              <DropdownMenuItem
                onClick={handleCompleteChallenge}
                className="text-green-600 cursor-pointer"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Completed
              </DropdownMenuItem>
            )}

            {!challenge.isOwner && (
              <DropdownMenuItem
                onClick={handleLeaveChallenge}
                className="text-amber-600 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Leave Challenge
              </DropdownMenuItem>
            )}

            {challenge.isOwner && (
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
      {deleteDialogOpen && (
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteChallenge}
          title="Delete Challenge"
          description="Are you sure you want to delete this challenge? This action cannot be undone."
        />
      )}
    </Card>
  );
}
