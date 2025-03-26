import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";

interface LikeButtonProps {
  journeyId: string;
  initialLikes: number;
  initialLikedBy: string[];
  onUpdate?: () => void;
}

export function LikeButton({
  journeyId,
  initialLikes,
  initialLikedBy = [],
  onUpdate,
}: LikeButtonProps) {
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setIsLiked(initialLikedBy.includes(currentUser.uid));
    }
  }, [currentUser, initialLikedBy]);

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);

      const journeyRef = doc(db, "journeys", journeyId);
      const journeyDoc = await getDoc(journeyRef);

      if (!journeyDoc.exists()) {
        console.error("Journey document doesn't exist");
        return;
      }

      const journeyData = journeyDoc.data();
      const likedBy = journeyData.likedBy || [];

      if (isLiked) {
        await updateDoc(journeyRef, {
          likes: likes - 1,
          likedBy: arrayRemove(currentUser.uid),
        });
        setLikes((prev) => prev - 1);
        setIsLiked(false);
      } else {
        await updateDoc(journeyRef, {
          likes: likes + 1,
          likedBy: arrayUnion(currentUser.uid),
        });
        setLikes((prev) => prev + 1);
        setIsLiked(true);
      }

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 px-2 ${isLiked ? "text-primary" : ""}`}
      onClick={handleLike}
      disabled={isLoading || !currentUser}
    >
      <ThumbsUp className={`mr-1 h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
      {likes}
    </Button>
  );
}
