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
import { MessageSquare, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { StartChatButton } from "@/components/messaging/start-chat-button";
import { ConnectButton } from "@/components/profile/connect-button";
import { ConnectionsDisplay } from "@/components/profile/connections-display";
import { Separator } from "@/components/ui/separator";

interface PublicProfileProps {
  userId: string;
  userData: any;
}

export function PublicProfile({ userId, userData }: PublicProfileProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={userData.profileImage} alt={userData.username} />
            <AvatarFallback className="text-2xl">
              {userData.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="text-center sm:text-left flex-1">
            <CardTitle className="text-2xl">{userData.username}</CardTitle>
            <CardDescription className="flex items-center justify-center sm:justify-start mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              Joined{" "}
              {userData.createdAt &&
                format(new Date(userData.createdAt.toDate()), "MMMM yyyy")}
            </CardDescription>

            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              {userData.interests &&
                userData.interests.map((interest: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {interest}
                  </Badge>
                ))}
            </div>
          </div>

          <div className="flex sm:flex-col gap-2">
            <StartChatButton
              recipientId={userId}
              recipientName={userData.username}
            />
            <ConnectButton userId={userId} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {userData.bio ? (
          <div className="space-y-2">
            <h3 className="font-semibold">About</h3>
            <p className="text-sm whitespace-pre-wrap">{userData.bio}</p>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-2">
            This user hasn't added a bio yet.
          </div>
        )}

        {userData.goal && (
          <div className="mt-4">
            <h3 className="font-semibold">Current Goal</h3>
            <p className="text-sm mt-1">{userData.goal}</p>
          </div>
        )}

        <Separator className="my-4" />

        <ConnectionsDisplay userId={userId} />
      </CardContent>
    </Card>
  );
}
