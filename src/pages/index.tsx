import TypographyH2 from "@/components/ui/TypographyH2";
import TypographyH3 from "@/components/ui/TypographyH3";
import TypographyP from "@/components/ui/TypographyP";
import { type NextPage } from "next";

import { api } from "@/utils/api";

const Home: NextPage = () => {
  const { data: lessons, isLoading } = api.lessons.getAll.useQuery();
  const { data: topics, isLoading: isLoadingTopics } =
    api.topics.getAll.useQuery();

  return (
    <>
      <div className="h-screen">
        <TypographyH2 title="MUN Sessions coming up" />
        <div>
          {isLoading ||
          isLoadingTopics ||
          typeof lessons === "undefined" ||
          typeof topics === "undefined"
            ? "Loading..."
            : lessons.map((lesson, i) => {
                return (
                  <div
                    key={i}
                    className={`flex flex-col rounded-md border md:flex-row ${
                      i % 2 === 0 ? "bg-slate-300" : "bg-slate-400"
                    }`}
                  >
                    <div className="min-w-sm max-w-md">
                      <TypographyH3
                        title={
                          (
                            topics.find(
                              (topic) => topic.id === lesson.topicId
                            ) || { title: "SOMETHING WENT WRONG" }
                          ).title
                        }
                      />
                      <TypographyP text={lesson.date.toDateString()} />
                      <TypographyP text={lesson.location} />
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </>
  );
};

export default Home;
