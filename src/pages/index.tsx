import TypographyH2 from "@/components/ui/TypographyH2";
import { type NextPage } from "next";

import TypographyTable from "@/components/ui/TypographyTable";
import TableContent from "@/components/TableContent";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TypographyH4 from "@/components/ui/TypographyH4";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { appRouter } from "@/server/api/root";
import { createInnerTRPCContext } from "@/server/api/trpc";
import superjson from "superjson";

export async function getServerSideProps() {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: createInnerTRPCContext({ session: null }),
    transformer: superjson, // optional - adds superjson serialization
  });

  await ssg.lessons.getAll.prefetch("asc");
  await ssg.topics.getAll.prefetch();

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
  };
}

const Home: NextPage = () => {
  const router = useRouter();
  const page = isNaN(Number(router.query.page)) ? 0 : Number(router.query.page);
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
      <div className="flex h-screen flex-col">
        <TypographyH2 title="MUN Lessons coming up" />
        <TypographyH4 title="Go back or forwards in months" />
        <div className="flex flex-row">
          <Link
            className="flex flex-row"
            href={page === 1 ? `/` : `/?page=${page - 1}`}
          >
            <Button variant="link">
              <ArrowLeft className="h-4 w-4" />
              Backward
            </Button>
          </Link>
          <Link href="/">
            <Button variant="default">Today</Button>
          </Link>
          <Link href={page === -1 ? `/` : `/?page=${page + 1}`}>
            <Button variant="link">
              Forward
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <TypographyTable titles={days} rows={TableContent()} />
      </div>
    </>
  );
};

export default Home;
