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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Loader2,
  Calendar as CalendarIcon,
  PlusCircle,
  Trash2,
  Pencil,
  Save,
  GripVertical,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { v4 as uuidv4 } from "uuid";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  endDate: z.date({
    required_error: "End date is required.",
  }),
  isPublic: z.boolean().default(false),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
});

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

interface SortableMilestoneItemProps {
  milestone: Milestone;
  isEditing: boolean;
  editedText: string;
  setEditedText: (text: string) => void;
  onStartEdit: (id: string, text: string) => void;
  onSaveEdit: () => void;
  onRemove: (id: string) => void;
}

function SortableMilestoneItem({
  milestone,
  isEditing,
  editedText,
  setEditedText,
  onStartEdit,
  onSaveEdit,
  onRemove,
}: SortableMilestoneItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: milestone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 border rounded-md"
    >
      <div className="flex items-center flex-grow mr-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 cursor-grab"
          type="button"
          {...attributes}
          {...(listeners ?? {})}
          onClick={(e) => e.preventDefault()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </Button>

        {isEditing ? (
          <Input
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="ml-2 h-7 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSaveEdit();
              }
            }}
          />
        ) : (
          <span className="text-sm ml-2">{milestone.title}</span>
        )}
      </div>

      <div className="flex">
        {isEditing ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSaveEdit}
            className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
            disabled={!editedText.trim()}
          >
            <Save className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onStartEdit(milestone.id, milestone.title)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(milestone.id)}
          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ChallengeForm() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState("");
  const router = useRouter();
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(
    null
  );
  const [editedMilestoneText, setEditedMilestoneText] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      isPublic: false,
      category: "",
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addMilestone = () => {
    if (!newMilestone.trim()) return;

    const milestone: Milestone = {
      id: uuidv4(),
      title: newMilestone.trim(),
      completed: false,
    };

    setMilestones([...milestones, milestone]);
    setNewMilestone("");
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const startEditMilestone = (id: string, text: string) => {
    setEditingMilestoneId(id);
    setEditedMilestoneText(text);
  };

  const saveEditedMilestone = () => {
    if (!editingMilestoneId) return;

    setMilestones(
      milestones.map((m) =>
        m.id === editingMilestoneId
          ? { ...m, title: editedMilestoneText.trim() }
          : m
      )
    );

    setEditingMilestoneId(null);
    setEditedMilestoneText("");
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setMilestones((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const generateInvitationCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) return;

    try {
      setLoading(true);

      const invitationCode = generateInvitationCode();

      await addDoc(collection(db, "challenges"), {
        userId: currentUser.uid,
        title: values.title,
        description: values.description,
        endDate: values.endDate,
        isPublic: values.isPublic,
        category: values.category,
        createdAt: serverTimestamp(),
        status: "active",
        participants: [currentUser.uid],
        milestones: milestones,
        invitationCode,
      });

      toast.success("Your new challenge has been created successfully.", {
        description: "Challenge created",
      });

      router.push("/challenges");
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast.error("There was a problem creating your challenge.", {
        description: "Error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Challenge</CardTitle>
        <CardDescription>
          Set a goal and track your progress, optionally invite others to join
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What do you want to achieve?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your challenge and how you'll measure success"
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Fitness, Learning, Career"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() ||
                          date >
                            new Date(
                              new Date().setFullYear(
                                new Date().getFullYear() + 1
                              )
                            )
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div>
                <FormLabel>Milestones</FormLabel>
                <FormDescription>
                  Break down your challenge into smaller tasks to track progress
                </FormDescription>

                <div className="flex mt-2 mb-3">
                  <Input
                    placeholder="Add a milestone..."
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    className="mr-2"
                  />
                  <Button
                    type="button"
                    onClick={addMilestone}
                    disabled={!newMilestone.trim()}
                    size="icon"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {milestones.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No milestones added yet. Add your first step above.
                    </p>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={milestones.map((m) => m.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {milestones.map((milestone) => (
                          <SortableMilestoneItem
                            key={milestone.id}
                            milestone={milestone}
                            isEditing={milestone.id === editingMilestoneId}
                            editedText={editedMilestoneText}
                            setEditedText={setEditedMilestoneText}
                            onStartEdit={startEditMilestone}
                            onSaveEdit={saveEditedMilestone}
                            onRemove={removeMilestone}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Make Challenge Public
                    </FormLabel>
                    <FormDescription>
                      Allow others to discover and join your challenge
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Challenge"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
