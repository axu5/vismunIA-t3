import Loading from "@/components/Loading";
import TypographyH1 from "@/components/ui/TypographyH1";
import TypographyH2 from "@/components/ui/TypographyH2";
import TypographyP from "@/components/ui/TypographyP";
import { api } from "@/utils/api";
import type { Lesson, Topic } from "@prisma/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Lessons() {
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson>();
  const [topic, setTopic] = useState<Topic>();
  const lessonId =
    typeof router.query.lessonId !== "string" ? "" : router.query.lessonId;
  const lessonQuery = api.lessons.getById.useQuery(lessonId);

  useEffect(() => {
    if (!lessonQuery.data) return;
    const { lesson: l, topic: t } = lessonQuery.data;
    setLesson(l);
    setTopic(t);
  }, [lessonQuery.data]);

  if (!router.isReady || lessonQuery.isLoading || !lessonQuery.data)
    return <Loading />;

  return (
    <>
      <div className="flex flex-row justify-around">
        <div className="flex flex-col">
          <TypographyH1 title="About the lesson" />
          <TypographyH2 title={lesson?.location || ""} />
          <TypographyP text={lesson?.date.toDateString() || ""} />
        </div>
        <div>
          <TypographyH1 title="About the topic" />
          <TypographyH2 title={topic?.title || ""} />
          <TypographyP text={topic?.description || "No description"} />
          <TypographyH2 title={"Documents"} />
        </div>
      </div>
    </>
  );
}
