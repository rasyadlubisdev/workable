"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ChatMessage from "@/components/chat/chat-message"
import ChatInput from "@/components/chat/chat-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, BriefcaseIcon, FileText, HelpCircle } from "lucide-react"
import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { toast } from "react-toastify"
import { chatService } from "@/lib/chat-service"

export type Message = {
  id?: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: any
  attachments?: {
    type: string
    url: string
    name: string
  }[]
}

const topics = [
  {
    id: "career",
    title: "Konsultasi Karir",
    description:
      "Dapatkan saran karir yang sesuai dengan keahlian dan kebutuhan Anda",
    icon: <BriefcaseIcon className="h-6 w-6 text-workable-blue" />,
  },
  {
    id: "cv",
    title: "Perbaikan CV",
    description: "Dapatkan masukan untuk meningkatkan CV Anda",
    icon: <FileText className="h-6 w-6 text-workable-blue" />,
  },
  {
    id: "jobs",
    title: "Rekomendasi Pekerjaan",
    description: "Temukan lowongan yang sesuai dengan profil Anda",
    icon: <BriefcaseIcon className="h-6 w-6 text-workable-blue" />,
  },
  {
    id: "help",
    title: "Bantuan Lainnya",
    description: "Tanyakan hal lain terkait pekerjaan dan disabilitas",
    icon: <HelpCircle className="h-6 w-6 text-workable-blue" />,
  },
]

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Halo! Saya adalah asisten WorkAble. Apa yang bisa saya bantu hari ini?",
      timestamp: new Date(),
    },
  ])
  const [loading, setLoading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchChatHistory()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchChatHistory = async () => {
    if (!user?.id) return

    try {
      const chatsRef = collection(db, "chats")
      const q = query(
        chatsRef,
        where("userId", "==", user.id),
        orderBy("timestamp", "asc")
      )

      const chatDocs = await getDocs(q)

      if (!chatDocs.empty) {
        const chatHistory = chatDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[]

        if (chatHistory.length > 0) {
          setMessages(chatHistory)
        }
      }
    } catch (error) {
      console.error("Error fetching chat history:", error)
    }
  }

  const handleSendMessage = async (message: string, attachments?: File[]) => {
    if (!message.trim() && (!attachments || attachments.length === 0)) return
    if (!user?.id) {
      toast.error("Anda harus login terlebih dahulu")
      router.push("/auth/login")
      return
    }

    try {
      setLoading(true)

      const userMessage: Message = {
        role: "user",
        content: message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])

      await addDoc(collection(db, "chats"), {
        userId: user.id,
        role: "user",
        content: message,
        timestamp: serverTimestamp(),
      })

      let botResponse = ""

      if (selectedTopic === "jobs") {
        botResponse = await chatService.getJobRecommendations(message)
      } else if (selectedTopic === "cv") {
        botResponse = await chatService.getCVFeedback(message)
      } else if (selectedTopic === "career") {
        botResponse = await chatService.getCareerAdvice(
          message,
          user?.jobSeekerId ? user.jobSeekerId : undefined
        )
      } else {
        botResponse = await chatService.getGeneralHelp(message)
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: botResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      await addDoc(collection(db, "chats"), {
        userId: user.id,
        role: "assistant",
        content: botResponse,
        timestamp: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Gagal mengirim pesan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  const selectTopic = (topicId: string) => {
    setSelectedTopic(topicId)

    let welcomeMessage = ""
    switch (topicId) {
      case "career":
        welcomeMessage =
          "Silakan ceritakan latar belakang pendidikan, pengalaman kerja, keterampilan, dan minat Anda. Saya akan membantu memberikan saran karir yang sesuai."
        break
      case "cv":
        welcomeMessage =
          "Silakan unggah CV Anda atau ceritakan tentang CV Anda, dan saya akan memberikan saran untuk meningkatkannya."
        break
      case "jobs":
        welcomeMessage =
          "Ceritakan tentang pengalaman, keterampilan, dan jenis pekerjaan yang Anda cari, dan saya akan merekomendasikan lowongan yang sesuai."
        break
      case "help":
        welcomeMessage =
          "Apa yang ingin Anda tanyakan terkait pekerjaan atau disabilitas? Saya akan berusaha membantu Anda."
        break
    }

    const assistantMessage: Message = {
      role: "assistant",
      content: welcomeMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="bg-workable-blue p-4 text-white">
          <div className="flex items-center">
            <Bot className="h-6 w-6 mr-2" />
            <h1 className="text-xl font-semibold">Asisten WorkAble</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {selectedTopic === null ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-medium text-gray-700">
                  Pilih topik untuk memulai percakapan
                </h2>
              </div>
              {topics.map((topic) => (
                <Card
                  key={topic.id}
                  className="cursor-pointer hover:border-workable-blue transition-all"
                  onClick={() => selectTopic(topic.id)}
                >
                  <CardContent className="p-4 flex items-start">
                    <div className="bg-gray-100 p-2 rounded-lg mr-4">
                      {topic.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{topic.title}</h3>
                      <p className="text-gray-600 text-sm">
                        {topic.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  topic={selectedTopic || undefined}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {selectedTopic !== null && (
          <div className="p-4 bg-white border-t">
            <ChatInput
              onSendMessage={handleSendMessage}
              loading={loading}
              topic={selectedTopic}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
