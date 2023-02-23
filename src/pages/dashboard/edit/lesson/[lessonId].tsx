import type { NextPage } from "next/types";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import TypographyH4 from "@/components/ui/TypographyH4";
import { Button } from "@/components/ui/button";
import { useState, type FormEvent } from "react";
import { useToast } from "@/hooks/ui/use-toast";
import type { Lesson, Topic } from "@prisma/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const TopicEditor: NextPage = () => {
  const { toast } = useToast();
  const [lesson, setLesson] = useState<Lesson>();
  const [topic, setTopic] = useState<Topic>();
  const [topicId, setTopicId] = useState("");
  const router = useRouter();
  if (!router.isReady) return <>Loading router...</>;
  const { lessonId } = router.query;
  const _lessonId = typeof lessonId === "string" ? lessonId : "";
  const lessonQuery = api.lessons.getById.useQuery(_lessonId, {
    onSuccess({ lesson: l, topic: t }) {
      setLesson(l);
      setTopic(t);
      setTopicId(t.id);
    },
  });
  const topicsQuery = api.topics.getAll.useQuery();
  const deleter = api.lessons.delete.useMutation({
    async onSuccess() {
      await router.push("/dashboard/edit/lesson");
    },
  });
  const editor = api.lessons.edit.useMutation({
    onSuccess() {
      toast({
        title: `Successfully updated the lesson`,
        description: `Updated the lesson`,
      });
    },
  });
  if (lessonQuery.isLoading) return <>Loading lesson...</>;
  if (topicsQuery.isLoading) return <>Loading topics...</>;
  function deleteMe() {
    deleter.mutate(_lessonId);
  }

  function editMe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lesson === undefined || topic === undefined) {
      toast({
        title: "Could not edit",
        description: "Could not edit because lesson or topic is null",
        variant: "destructive",
      });
      return;
    }
    // Get new title
    editor.mutate({
      id: lesson.id,
      data: {
        location: lesson.location,
        date: lesson.date,
        topicId,
      },
    });
  }

  if (lessonQuery.isLoading) return <h1>Loading...</h1>;
  if (lessonQuery.isError) return <h1>{lessonQuery.error.message}</h1>;
  if (lesson === undefined || topic === undefined)
    return <>Something went wrong</>;
  if (lessonQuery.isSuccess) {
    return (
      <div>
        <Link href="/dashboard/edit/topic">Go back</Link>
        <form onSubmit={editMe}>
          <TypographyH4 title="Lesson Location" />
          <Input
            value={lesson.location}
            type="text"
            placeholder="Topic title"
            onChange={(e) =>
              setLesson((prev) => {
                if (prev === undefined) return lessonQuery.data.lesson;
                return { ...prev, location: e.target.value };
              })
            }
          />
          <TypographyH4 title="Lesson date" />
          <Input
            value={`${lesson.date.getFullYear()}-${
              lesson.date.getMonth() + 1
            }-${lesson.date.getDate()}`}
            type="text"
            placeholder="Topic title"
            onChange={(e) =>
              setLesson((prev) => {
                if (prev === undefined) return lessonQuery.data.lesson;
                return { ...prev, date: new Date(e.target.value) };
              })
            }
          />
          <TypographyH4 title="Lesson topic" />
          {topicsQuery.isSuccess &&
            (topicsQuery.data.length === 0 ? (
              <Link href="/dashboard/edit/topic">
                <Button variant="link">No topics found CLICK HERE</Button>
              </Link>
            ) : (
              <RadioGroup
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  const topicId = target.value;
                  setTopicId(topicId);
                }}
                defaultValue={(topicsQuery.data[0] || { id: "" }).id}
              >
                {topicsQuery.data.map((topic, i) => {
                  return (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={topic.id} id={topic.id} />
                      <Label htmlFor={topic.id}>{topic.title}</Label>
                    </div>
                  );
                })}
              </RadioGroup>
            ))}
          <Button variant="destructive" type="button" onClick={deleteMe}>
            Delete this lesson
          </Button>
          <Button type="submit">Save changes</Button>
        </form>
      </div>
    );
  }
  return <>Something went wrong</>;
};

export default TopicEditor;
