import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next/types";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import TypographyH4 from "@/components/ui/TypographyH4";
import { Button } from "@/components/ui/button";
import { useState, type FormEvent, useRef, useEffect } from "react";
import { useToast } from "@/hooks/ui/use-toast";
import type { Lesson, Topic } from "@prisma/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Loading from "@/components/Loading";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { appRouter } from "@/server/api/root";
import { createInnerTRPCContext } from "@/server/api/trpc";
import superjson from "superjson";
import DatePicker from "@/components/DatePicker";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { lessonId } = context.query;
  const _lessonId = typeof lessonId === "string" ? lessonId : "";
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: createInnerTRPCContext({ session: null }),
    transformer: superjson, // optional - adds superjson serialization
  });

  await ssg.lessons.getById.prefetch(_lessonId);

  return {
    props: {
      trpcState: ssg.dehydrate(),
      lessonId: _lessonId,
    },
  };
}

const TopicEditor: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ lessonId }) => {
  const { toast } = useToast();
  const [lesson, setLesson] = useState<Lesson>();
  const [topic, setTopic] = useState<Topic>();
  const topicIdRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const lessonLocationRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const lessonQuery = api.lessons.getById.useQuery(lessonId, {
    onSuccess({ lesson: l, topic: t }) {
      setLesson(l);
      setTopic(t);
    },
    onError(error) {
      toast({
        title: "An error has occurred",
        description: error.message,
        variant: "destructive",
      });
    },
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (
      !(
        yearRef.current == undefined ||
        monthRef.current == undefined ||
        dayRef.current == undefined ||
        lessonLocationRef.current == undefined ||
        lesson == undefined
      )
    ) {
      dayRef.current.value = lesson.timestamp.getDate().toString();
      monthRef.current.value = (lesson.timestamp.getMonth() + 1).toString();
      yearRef.current.value = lesson.timestamp.getFullYear().toString();
      lessonLocationRef.current.value = lesson.location;
    }
  }, [lesson]);
  const topicsQuery = api.topics.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const deleter = api.lessons.delete.useMutation({
    async onSuccess() {
      await router.push("/dashboard/edit/lesson");
    },
    onError(error) {
      toast({
        title: "Failed to delete the lesson",
        variant: "destructive",
        description: error.message,
      });
    },
  });
  const editor = api.lessons.edit.useMutation({
    onSuccess() {
      toast({
        title: `Successfully updated the lesson`,
        description: `Updated the lesson`,
      });
    },
    onError(error) {
      toast({
        title: "Failed to update the lesson",
        variant: "destructive",
        description: error.message,
      });
    },
  });
  if (!router.isReady || lessonQuery.isLoading || topicsQuery.isLoading)
    return <Loading />;
  function deleteMe() {
    deleter.mutate(lessonId);
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
    if (
      lessonLocationRef.current === null ||
      yearRef.current == undefined ||
      monthRef.current == undefined ||
      dayRef.current == undefined ||
      topicIdRef.current == undefined
    ) {
      return;
    }

    const timestamp = new Date();
    timestamp.setFullYear(Number(yearRef.current.value));
    timestamp.setMonth(Number(monthRef.current.value) - 1);
    timestamp.setDate(Number(dayRef.current.value));

    const topicId = (
      topicIdRef.current.querySelector(`[aria-checked="true"]`) as unknown as {
        value: string;
      }
    ).value;

    // Get new title
    editor.mutate({
      id: lesson.id,
      data: {
        location: lessonLocationRef.current.value,
        timestamp,
        topicId,
      },
    });
  }

  if (lessonQuery.isError) return <h1>{lessonQuery.error.message}</h1>;
  if (lesson === undefined || topic === undefined)
    return <>Something went wrong</>;
  if (lessonQuery.isSuccess) {
    return (
      <div>
        <Link href="/dashboard/edit/lesson">Go back</Link>
        <form onSubmit={editMe}>
          <TypographyH4 title="Lesson Location" />
          <Input ref={lessonLocationRef} type="text" placeholder="Location" />
          <DatePicker dayRef={dayRef} monthRef={monthRef} yearRef={yearRef} />
          <TypographyH4 title="Lesson topic" />
          {topicsQuery.isSuccess &&
            (topicsQuery.data.length === 0 ? (
              <Link href="/dashboard/edit/topic">
                <Button variant="link">No topics found CLICK HERE</Button>
              </Link>
            ) : (
              <RadioGroup ref={topicIdRef} defaultValue={lesson.topicId}>
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
