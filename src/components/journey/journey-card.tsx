import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { LikeButton } from "./like-button";
import { CommentSection } from "./comment-section";
import Link from "next/link";

interface JourneyCardProps {
  journey: any;
  // onView: () => void;
  onEdit?: () => void;
  isCurrentUser?: boolean;
  showActions?: boolean;
}

export function JourneyCard({
  journey,
  // onView,
  onEdit,
  isCurrentUser = false,
  showActions = true,
}: JourneyCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Link href={`/profile/${journey.userId}`} className="mr-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={journey.profileImage}
                  alt={journey.username}
                />
                <AvatarFallback>
                  {journey.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{journey.title}</CardTitle>
                {journey.isEdited && (
                  <span className="text-xs text-muted-foreground">
                    (edited)
                  </span>
                )}
              </div>
              <CardDescription>
                {journey.createdAt &&
                  format(new Date(journey.createdAt.toDate()), "PP")}
              </CardDescription>
            </div>
          </div>

          {showActions && isCurrentUser && onEdit && (
            <Button variant="ghost" size="sm" className="h-8" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <p className="whitespace-pre-wrap mb-4">{journey.content}</p>

        {journey.imageURL && (
          <div className="mt-2 mb-4 rounded-md overflow-hidden relative max-h-[400px] w-full flex justify-center">
            <img
              src={journey.imageURL}
              alt={journey.title}
              className="object-contain max-w-full max-h-[400px]"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-1 mt-2">
          {journey.tags?.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 flex flex-col items-start">
        <div className="w-full flex justify-between mb-2">
          <LikeButton
            journeyId={journey.id}
            initialLikes={journey.likes || 0}
            initialLikedBy={journey.likedBy || []}
          />

          {/* {showActions && (
            <Button variant="ghost" size="sm" className="h-8" onClick={onView}>
              View details
            </Button>
          )} */}
        </div>

        <CommentSection
          journeyId={journey.id}
          initialComments={journey.comments || []}
        />
      </CardFooter>
    </Card>
  );
}
