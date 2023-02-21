import TypographyH2 from "@/components/ui/TypographyH2";
import TypographyH3 from "@/components/ui/TypographyH3";
import TypographyH4 from "@/components/ui/TypographyH4";
import TypographyP from "@/components/ui/TypographyP";
import { type NextPage } from "next";

import { api } from "@/utils/api";

const Home: NextPage = () => {
  const { data: sessions, isLoading } = api.sessions.getAll.useQuery();

  // TODO: replace with an animation
  if (isLoading) return <h1>Loading...</h1>;

  return (
    <>
      <div className="h-screen">
        <TypographyH2 title="MUN Sessions coming up" />
        <div>
          {typeof sessions !== "undefined" &&
            sessions.map((session, i) => {
              return (
                <div
                  key={session.date.toUTCString()}
                  className={`flex flex-col rounded-md border md:flex-row ${
                    i % 2 === 0 ? "bg-slate-300" : "bg-slate-400"
                  }`}
                >
                  <div className="min-w-sm max-w-md">
                    <TypographyH3 title={session.topic.title} />
                    <TypographyH4 title={session.sessionName} />
                    <TypographyP text={session.date.toDateString()} />
                    <TypographyP text={session.location} />
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
