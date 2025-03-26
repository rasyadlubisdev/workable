"use client";

import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Loader2, UserPlus } from "lucide-react";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  doc,
} from "firebase/firestore";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  invitationCode: z.string().min(4, {
    message: "Invitation code must be at least 4 characters.",
  }),
});

export function JoinChallengeModal() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invitationCode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) return;

    try {
      setIsLoading(true);

      const invitationCode = values.invitationCode.toUpperCase();

      const challengesRef = collection(db, "challenges");
      const q = query(
        challengesRef,
        where("invitationCode", "==", invitationCode),
        where("status", "==", "active")
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("No active challenge found with this invitation code.", {
          description: "Invalid code",
        });
        return;
      }

      const challengeDoc = querySnapshot.docs[0];
      const challengeData = challengeDoc.data();

      // Check if user is already a participant
      if (
        challengeData.participants &&
        challengeData.participants.includes(currentUser.uid)
      ) {
        toast("You are already a participant in this challenge.", {
          description: "Already joined",
        });
        setOpen(false);
        router.push("/challenges");
        return;
      }

      // Add user to participants
      const challengeRef = doc(db, "challenges", challengeDoc.id);
      await updateDoc(challengeRef, {
        participants: arrayUnion(currentUser.uid),
      });

      toast.success(`You've joined "${challengeData.title}"`, {
        description: "Success!",
      });

      setOpen(false);
      form.reset();
      router.push("/challenges");
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast.error(
        "There was a problem joining the challenge. Please try again.",
        {
          description: "Error",
        }
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Join Challenge
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a Challenge</DialogTitle>
          <DialogDescription>
            Enter an invitation code to join a challenge
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="invitationCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invitation Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter code (e.g. ABC123)"
                      {...field}
                      value={field.value.toUpperCase()}
                    />
                  </FormControl>
                  <FormDescription>
                    Ask the challenge creator for their invitation code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Challenge"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
