import UserAllowed from "@/components/UserAllowed";
import TypographyH1 from "@/components/ui/TypographyH1";
import type { NextPage } from "next/types";

const Dashboard: NextPage = () => {
  return (
    <UserAllowed allowed={["TEACHER"]}>
      <TypographyH1 title="Dashboard" />
    </UserAllowed>
  );
};

export default Dashboard;
