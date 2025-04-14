import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Message } from "@/app/(dashboard)/job-seeker/chat/page"
import Link from "next/link"
import { Bot, User } from "lucide-react"
import JobSuggestion from "@/components/chat/job-suggestion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ChatMessageProps {
  message: Message
  topic?: string
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, topic }) => {
  const isUserMessage = message.role === "user"

  const renderMessageContent = (content: string) => {
    return (
      <div className="prose max-w-full prose-sm prose-p:my-1 prose-pre:bg-gray-100 prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <Link
                href={href || "#"}
                className="text-workable-blue hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </Link>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 mb-4",
        isUserMessage ? "justify-end" : "justify-start"
      )}
    >
      {!isUserMessage && (
        <Avatar className="h-8 w-8 bg-workable-blue text-white">
          <AvatarFallback>
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "rounded-lg p-3 max-w-[80%]",
          isUserMessage
            ? "bg-workable-blue text-white rounded-tr-none"
            : "bg-white border border-gray-200 shadow-sm rounded-tl-none"
        )}
      >
        {renderMessageContent(message.content)}

        {!isUserMessage &&
          topic === "jobs" &&
          message.content.includes("lowongan") && (
            <div className="mt-3">
              <JobSuggestion />
            </div>
          )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2">
            {message.attachments.map((attachment, index) => (
              <div
                key={index}
                className="text-xs flex items-center gap-1 text-blue-500 hover:underline"
              >
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {attachment.name}
                </a>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs mt-1 opacity-70">
          {message.timestamp &&
            new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
        </div>
      </div>

      {isUserMessage && (
        <Avatar className="h-8 w-8 bg-gray-300">
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

export default ChatMessage
