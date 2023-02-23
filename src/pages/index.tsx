import TypographyH2 from "@/components/ui/TypographyH2";
import { type NextPage } from "next";

import TypographyTable from "@/components/ui/TypographyTable";
import TableContent from "@/components/TableContent";

const Home: NextPage = () => {
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
        <TypographyTable titles={days} rows={TableContent()} />
      </div>
    </>
  );
};

export default Home;
