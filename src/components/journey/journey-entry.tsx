"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase/config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
  tags: z.string().optional(),
});

interface JourneyEntryFormProps {
  onJourneyCreated?: () => void;
}

export function JourneyEntryForm({ onJourneyCreated }: JourneyEntryFormProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) return;

    try {
      setLoading(true);

      await addDoc(collection(db, "journeys"), {
        userId: currentUser.uid,
        title: values.title,
        content: values.content,
        tags: values.tags
          ? values.tags.split(",").map((tag) => tag.trim())
          : [],
        imageURL: imageURL,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: [],
      });

      form.reset();
      setImageURL(null);

      if (onJourneyCreated) {
        onJourneyCreated();
      }
    } catch (error) {
      console.error("Error creating journey entry:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentUser) return;

    const file = e.target.files[0];
    const fileId = uuidv4();
    const fileRef = ref(storage, `journey-images/${currentUser.uid}/${fileId}`);

    try {
      setUploadingImage(true);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setImageURL(url);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Your Journey</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What's your milestone today?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share details about your progress..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. learning, progress, milestone"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("image")?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Add Image
                    </>
                  )}
                </Button>
                {imageURL && (
                  <span className="text-sm text-muted-foreground">
                    Image uploaded successfully
                  </span>
                )}
              </div>

              {imageURL && (
                <div className="rounded-md overflow-hidden max-h-[200px] w-full">
                  <img
                    src={imageURL}
                    alt="Journey preview"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || uploadingImage}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Post Update"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
