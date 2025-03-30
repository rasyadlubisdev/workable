"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Send,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

interface Comment {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  text: string;
  createdAt: any;
}

interface CommentSectionProps {
  journeyId: string;
  initialComments?: Comment[];
}

export function CommentSection({
  journeyId,
  initialComments = [],
}: CommentSectionProps) {
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [userData, setUserData] = useState<{
    username: string;
    profileImage: string;
  } | null>(null);
  const [comments, setComments] = useState<Comment[]>(initialComments);

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  useEffect(() => {
    const journeyRef = doc(db, "journeys", journeyId);
    const unsubscribe = onSnapshot(journeyRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.comments) {
          setComments(data.comments);
        }
      }
    });

    return () => unsubscribe();
  }, [journeyId]);

  const fetchUserData = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({
          username: data.username || "User",
          profileImage: data.profileImage || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUser || !userData || !commentText.trim()) return;

    try {
      setIsSubmitting(true);

      const newComment = {
        id: uuidv4(),
        userId: currentUser.uid,
        username: userData.username,
        profileImage: userData.profileImage,
        text: commentText.trim(),
        createdAt: Timestamp.now(),
      };

      const updatedComments = [...comments, newComment];

      const journeyRef = doc(db, "journeys", journeyId);
      await updateDoc(journeyRef, {
        comments: updatedComments,
      });

      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to post comment. Please try again.", {
        description: "Error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedComments = showAll ? comments : comments.slice(0, 3);
  const hasMoreComments = comments.length > 3;

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          {comments.length}
        </Button>
        <span className="text-sm text-muted-foreground">
          Comment{comments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-2">
          {currentUser && (
            <div className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userData?.profileImage} />
                <AvatarFallback>
                  {userData?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  className="min-h-[60px] resize-none"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !commentText.trim()}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {displayedComments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profileImage} />
                    <AvatarFallback>
                      {comment.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-sm">
                        {comment.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt.toDate()), "PPp")}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.text}</p>
                  </div>
                </div>
              ))}

              {hasMoreComments && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show all ({comments.length}) comments
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
