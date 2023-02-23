import TypographyH2 from "@/components/ui/TypographyH2";
import TypographyH3 from "@/components/ui/TypographyH3";
import TypographyP from "@/components/ui/TypographyP";
import { type NextPage } from "next";

import { api } from "@/utils/api";
import TypographyTable from "@/components/ui/TypographyTable";
import { type ReactNode, useMemo } from "react";
import { add, isSameDay } from "date-fns";

const Home: NextPage = () => {
  const lessonsQuery = api.lessons.getAll.useQuery("asc");
  const topicsQuery = api.topics.getAll.useQuery();
  const rows = useMemo<ReactNode[][]>(() => {
    if (lessonsQuery.isLoading || topicsQuery.isLoading)
      return [[]] as ReactNode[][];

    if (lessonsQuery.isError || topicsQuery.isError)
      return [[]] as ReactNode[][];

    // get last lesson date and calculate days in between
    const { data: lessons } = lessonsQuery;
    if (lessons.length === 0) return [[]] as ReactNode[][];
    const now = new Date();
    let nextLessonIndex = 0;
    // max 4 rows
    const rows = new Array<ReactNode[]>(4).fill([]).map((_, row) => {
      return new Array<ReactNode>(7).fill(<></>).map((_, col) => {
        // increment now
        const compare = add(now, {
          days: row * 7 + col,
        });

        const nextLesson = lessons[nextLessonIndex];

        if (nextLesson === undefined) return <></>;
        console.log(nextLesson.date.getDate(), compare.getDate());
        if (!isSameDay(nextLesson.date, compare)) return <></>;
        nextLessonIndex++;

        const topic = topicsQuery.data.find(
          ({ id }) => id === nextLesson.topicId
        );
        if (topic === undefined) return <></>;

        return (
          <div key={`${row}-${col}`}>
            <TypographyH3 title={topic.title} />
            <TypographyP text={topic.description} />
            <TypographyP text={nextLesson.location} />
          </div>
        ) as ReactNode;
      });
    });

    return rows as ReactNode[][];
  }, [lessonsQuery, topicsQuery]);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const today = new Date().getDay();

  // shift array by today
  for (let i = 0; i < today; ++i) {
    const first = days.shift();
    if (first === undefined) continue; // Error case should not happen
    days.push(first);
  }

  return (
    <>
      <div className="h-screen">
        <TypographyH2 title="MUN Sessions coming up" />
        <TypographyTable titles={days} rows={rows} />
      </div>
    </>
  );
};

export default Home;
