import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, isPast } from "date-fns";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/auth-context";
import {
  Loader2,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Target,
  Users,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChallengeDetailsProps {
  challenge: any;
  onClose: () => void;
  onUpdate: () => void;
}

const milestoneSchema = z.object({
  title: z.string().min(3, {
    message: "Milestone title must be at least 3 characters.",
  }),
});

export function ChallengeDetails({
  challenge,
  onClose,
  onUpdate,
}: ChallengeDetailsProps) {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(
    null
  );

  const milestoneForm = useForm<z.infer<typeof milestoneSchema>>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      title: "",
    },
  });

  useEffect(() => {
    if (challenge.participants && challenge.participants.length > 0) {
      fetchParticipants();
    }
  }, [challenge]);

  const fetchParticipants = async () => {
    try {
      const participantsData = await Promise.all(
        challenge.participants.map(async (userId: string) => {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            return {
              id: userId,
              ...userDoc.data(),
            };
          }
          return null;
        })
      );

      setParticipants(participantsData.filter(Boolean));
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const addMilestone = async (data: z.infer<typeof milestoneSchema>) => {
    if (!currentUser || !challenge) return;

    try {
      setAddingMilestone(true);

      const newMilestone = {
        id: Date.now().toString(),
        title: data.title,
        completed: false,
        createdAt: new Date(),
      };

      const challengeRef = doc(db, "challenges", challenge.id);
      await updateDoc(challengeRef, {
        milestones: arrayUnion(newMilestone),
      });

      challenge.milestones = [...(challenge.milestones || []), newMilestone];

      milestoneForm.reset();

      onUpdate();
    } catch (error) {
      console.error("Error adding milestone:", error);
    } finally {
      setAddingMilestone(false);
    }
  };

  const toggleMilestone = async (
    milestoneId: string,
    currentValue: boolean
  ) => {
    if (!currentUser || !challenge) return;

    try {
      setUpdatingMilestone(milestoneId);

      const challengeRef = doc(db, "challenges", challenge.id);
      const challengeDoc = await getDoc(challengeRef);

      if (!challengeDoc.exists()) return;

      const data = challengeDoc.data();
      const milestones = [...data.milestones];

      const milestoneIndex = milestones.findIndex((m) => m.id === milestoneId);
      if (milestoneIndex !== -1) {
        milestones[milestoneIndex] = {
          ...milestones[milestoneIndex],
          completed: !currentValue,
        };

        await updateDoc(challengeRef, {
          milestones: milestones,
        });

        challenge.milestones = milestones;

        onUpdate();
      }
    } catch (error) {
      console.error("Error toggling milestone:", error);
    } finally {
      setUpdatingMilestone(null);
    }
  };

  const calculateProgress = () => {
    if (!challenge.milestones || challenge.milestones.length === 0) return 0;

    const completedMilestones = challenge.milestones.filter(
      (m: any) => m.completed
    ).length;
    return Math.round(
      (completedMilestones / challenge.milestones.length) * 100
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{challenge.title}</DialogTitle>
            <Badge
              variant={
                isPast(new Date(challenge.endDate.toDate()))
                  ? "destructive"
                  : "outline"
              }
            >
              {challenge.status}
            </Badge>
          </div>
          <DialogDescription>
            Created on {format(new Date(challenge.createdAt.toDate()), "PPP")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid gap-4 py-2">
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-semibold">End Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(challenge.endDate.toDate()), "PPP")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Target className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-semibold">Category</h4>
                  <p className="text-sm text-muted-foreground">
                    {challenge.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-semibold">Visibility</h4>
                  <p className="text-sm text-muted-foreground">
                    {challenge.isPublic
                      ? "Public - others can discover and join"
                      : "Private - only you can see this"}
                  </p>
                </div>
              </div>
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
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4 mt-4">
            <Form {...milestoneForm}>
              <form
                onSubmit={milestoneForm.handleSubmit(addMilestone)}
                className="space-y-4"
              >
                <FormField
                  control={milestoneForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add New Milestone</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="e.g. Complete chapter 1"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={addingMilestone}
                        >
                          {addingMilestone ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <PlusCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormDescription>
                        Break down your challenge into achievable steps
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            {!challenge.milestones || challenge.milestones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  No milestones added yet. Create your first milestone to track
                  progress.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {challenge.milestones.map((milestone: any) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-2 p-3 border rounded-md"
                  >
                    <Checkbox
                      checked={milestone.completed}
                      onCheckedChange={() =>
                        toggleMilestone(milestone.id, milestone.completed)
                      }
                      disabled={!!updatingMilestone}
                      id={`milestone-${milestone.id}`}
                    />
                    <label
                      htmlFor={`milestone-${milestone.id}`}
                      className={`text-sm flex-grow cursor-pointer ${
                        milestone.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {milestone.title}
                    </label>
                    {updatingMilestone === milestone.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="participants" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold">People involved</h3>
                {challenge.isPublic && (
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    Public Challenge
                  </Badge>
                )}
              </div>

              {participants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No participants yet besides you.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {participants.map((participant) => (
                    <Card key={participant.id}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={participant.profileImage}
                            alt={participant.username}
                          />
                          <AvatarFallback>
                            {participant.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{participant.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {participant.id === currentUser?.uid
                              ? "(You)"
                              : "Participant"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {challenge.isPublic && (
                <div className="mt-6 text-sm text-muted-foreground">
                  <p>
                    This challenge is public. Others can discover and join
                    through the "Discover" tab.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <TooltipProvider>
            {challenge.status === "active" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Completed
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark this challenge as completed</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>

          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
