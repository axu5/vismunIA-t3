import { type ReactNode } from "react";
import { api } from "../utils/api";
import add from "date-fns/add";
import isBefore from "date-fns/isBefore";
import isSameDay from "date-fns/isSameDay";
import TypographyP from "@/components/ui/TypographyP";
import { useSession } from "next-auth/react";
import checkRoles from "@/utils/clientCheckRole";
import Link from "next/link";
import { Button } from "./ui/button";
import { Edit, PinIcon, PlusIcon, TrashIcon } from "lucide-react";
import { type Lesson, UserRole } from "@prisma/client";
import { useToast } from "@/hooks/ui/use-toast";
import { useRouter } from "next/router";
import TypographyH4 from "./ui/TypographyH4";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function TableContent() {
  const { toast } = useToast();
  const { data, status } = useSession();
  const router = useRouter();
  const apiContext = api.useContext();
  const lessonsQuery = api.lessons.getAll.useQuery("asc", {
    refetchOnWindowFocus: false,
  });
  const topicsQuery = api.topics.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const lessonDeleter = api.lessons.delete.useMutation({
    async onSuccess(data) {
      await apiContext.lessons.invalidate();
      toast({
        title: `Deleted lesson on ${data.timestamp.toDateString()}`,
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

  if (
    lessonsQuery.isLoading ||
    topicsQuery.isLoading ||
    lessonsQuery.isError ||
    topicsQuery.isError ||
    !router.isReady ||
    status === "loading"
  )
    return [[]] as ReactNode[][];

  const isAuthorized = data
    ? checkRoles(data.user.role, [UserRole.SECRETARY_GENERAL, UserRole.TEACHER])
    : false;

  function deleteMe(lesson: Lesson) {
    return () => {
      lessonDeleter.mutate(lesson.id);
    };
  }

  // get last lesson date and calculate days in between
  const { data: lessons } = lessonsQuery;
  const now = new Date(new Date().setHours(0, 0, 0, 0));
  const start = add(now, {
    weeks: isNaN(Number(router.query.page)) ? 0 : Number(router.query.page) * 4,
  });
  let nextLessonIndex = 0;
  while (
    isBefore(lessons[nextLessonIndex]?.timestamp || 0, start) &&
    nextLessonIndex < lessons.length
  ) {
    nextLessonIndex++;
  }
  // max 4 rows
  const rows = new Array<ReactNode[]>(4).fill([]).map((_, row) => {
    return new Array<ReactNode>(7).fill(<></>).map((_, col) => {
      // increment now
      const current = add(start, {
        days: row * 7 + col,
      });
      const dateString = `${
        months[current.getMonth()] || ``
      } ${current.getDate()}`;
      const defaultBehaviour = (
        <div key={`${row}-${col}`} className="min-h-[100px]">
          <TypographyP text={dateString} />
          {isAuthorized && (
            <Link
              href={`/dashboard/edit/lesson?y=${current.getFullYear()}&m=${
                current.getMonth() + 1
              }&d=${current.getDate()}`}
            >
              <Button variant={`outline`}>
                {/* Plus icon is a little bigger */}
                <PlusIcon className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      );

      const nextLesson = lessons[nextLessonIndex];

      if (nextLesson === undefined) return defaultBehaviour;
      if (!isSameDay(nextLesson.timestamp, current)) return defaultBehaviour;
      nextLessonIndex++;

      const topic = topicsQuery.data.find(
        ({ id }) => id === nextLesson.topicId
      );
      if (topic === undefined) return <></>;

      return (
        <div
          key={`${row}-${col}`}
          className="min-h-[100px] rounded p-2 hover:shadow"
        >
          <Link href={`/lessons/${nextLesson.id}`}>
            <TypographyP text={dateString} />
            {/* Show location */}
            <div className="flex flex-row">
              <p>{nextLesson.location}</p>
              <PinIcon className="mx-2 h-4 w-4" />
            </div>
            {/* Show topic description */}
            <TypographyH4 title={topic.title} />
            <TypographyP
              text={topic.description ? topic.description : "No description"}
            />
          </Link>
          {isAuthorized && (
            <Link href={`/dashboard/edit/lesson/${nextLesson.id}`}>
              <Button variant="ghost">
                <Edit className="mx-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          {isAuthorized && (
            <Button variant="ghost" onClick={deleteMe(nextLesson)}>
              <TrashIcon className="mx-2 h-4 w-4" />
            </Button>
          )}
        </div>
      ) as ReactNode;
    });
  });

  return rows as ReactNode[][];
}
