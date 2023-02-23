import TypographyH2 from "@/components/ui/TypographyH2";
import { type NextPage } from "next";

import TypographyTable from "@/components/ui/TypographyTable";
import TableContent from "@/components/TableContent";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TypographyH4 from "@/components/ui/TypographyH4";

const Home: NextPage = () => {
  const router = useRouter();
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const page = isNaN(Number(router.query.page)) ? 0 : Number(router.query.page);

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
        <TypographyH2 title="MUN Lessons coming up" />
        <TypographyH4 title="Go back or forwards in months" />
        <Link href={page === 1 ? `/` : `/?page=${page - 1}`}>
          <Button variant="link">Back</Button>
        </Link>
        <Link href="/">
          <Button variant="default">Today</Button>
        </Link>
        <Link href={page === -1 ? `/` : `/?page=${page + 1}`}>
          <Button variant="link">Forward</Button>
        </Link>
        <TypographyTable titles={days} rows={TableContent()} />
      </div>
    </>
  );
};

export default Home;
