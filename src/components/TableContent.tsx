import { type ReactNode } from "react";
import { api } from "../utils/api";
import add from "date-fns/add";
import isSameDay from "date-fns/isSameDay";
import TypographyH3 from "@/components/ui/TypographyH3";
import TypographyP from "@/components/ui/TypographyP";
import { useSession } from "next-auth/react";
import checkRoles from "@/utils/clientCheckRole";
import Link from "next/link";
import { Button } from "./ui/button";
import { PlusIcon, TrashIcon } from "lucide-react";
import type { Lesson } from "@prisma/client";
import { useToast } from "@/hooks/ui/use-toast";

export default function TableContent() {
  const { toast } = useToast();
  const { data } = useSession();

  const isAuthorized = data
    ? checkRoles(data.user.role, ["SECRETARY_GENERAL", "TEACHER"])
    : false;

  const apiContext = api.useContext();
  const lessonsQuery = api.lessons.getAll.useQuery("asc");
  const topicsQuery = api.topics.getAll.useQuery();
  const lessonDeleter = api.lessons.delete.useMutation({
    async onSuccess(data) {
      await apiContext.lessons.invalidate();
      toast({
        title: `Deleted lesson on ${data.date.toDateString()}`,
        description: "Successfully deleted the lesson",
      });
    },
    onError() {
      toast({
        title: `Error occurred`,
        description: "Could not delete the lesson",
        variant: "destructive",
      });
    },
  });

  function deleteMe(lesson: Lesson) {
    return () => {
      lessonDeleter.mutate(lesson.id);
    };
  }

  if (lessonsQuery.isLoading || topicsQuery.isLoading)
    return [[]] as ReactNode[][];

  if (lessonsQuery.isError || topicsQuery.isError) return [[]] as ReactNode[][];

  // get last lesson date and calculate days in between
  const { data: lessons } = lessonsQuery;
  const now = Date.now();
  let nextLessonIndex = 0;
  // max 4 rows
  const rows = new Array<ReactNode[]>(4).fill([]).map((_, row) => {
    return new Array<ReactNode>(7).fill(<></>).map((_, col) => {
      // increment now
      const compare = add(now, {
        days: row * 7 + col,
      });
      const defaultBehaviour = (
        <>
          <TypographyP text={compare.getDate().toString()} />
          {isAuthorized && (
            <Link
              href={`/dashboard/edit/lesson?y=${compare.getFullYear()}&m=${
                compare.getMonth() + 1
              }&d=${compare.getDate()}`}
            >
              <Button variant="subtle">
                <PlusIcon />
              </Button>
            </Link>
          )}
        </>
      );

      const nextLesson = lessons[nextLessonIndex];

      if (nextLesson === undefined) return defaultBehaviour;
      if (!isSameDay(nextLesson.date, compare)) return defaultBehaviour;
      nextLessonIndex++;

      const topic = topicsQuery.data.find(
        ({ id }) => id === nextLesson.topicId
      );
      if (topic === undefined) return <></>;

      return (
        <div key={`${row}-${col}`}>
          <TypographyP text={compare.getDate().toString()} />
          <TypographyH3 title={topic.title} />
          <TypographyP text={topic.description} />
          <TypographyP text={nextLesson.location} />
          {isAuthorized && (
            <Button variant="ghost" onClick={deleteMe(nextLesson)}>
              <TrashIcon />
            </Button>
          )}
        </div>
      ) as ReactNode;
    });
  });

  return rows as ReactNode[][];
}
