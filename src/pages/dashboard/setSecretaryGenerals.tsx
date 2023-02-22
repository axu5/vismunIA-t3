import UserAllowed from "@/components/UserAllowed";
import { Button } from "@/components/ui/Button";
import TypographyH1 from "@/components/ui/TypographyH1";
import TypographyTable from "@/components/ui/TypographyTable";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/utils/api";
import { User, UserRole } from "@prisma/client";
import type { NextPage } from "next/types";
import { type FormEvent } from "react";

const Dashboard: NextPage = () => {
  const { data: users, isLoading } = api.users.getAll.useQuery();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <UserAllowed allowed={["TEACHER"]}>
      <TypographyH1 title="TEACHER DASHBOARD" />
      {isLoading || typeof users === "undefined" ? (
        <h1>Loading...</h1>
      ) : (
        <DisplayUsers users={users} />
      )}
    </UserAllowed>
  );
};

function DisplayUsers({ users }: { users: User[] }) {
  // create three extra columns
  // secretary general | teacher | delete account

  // Could throw an exception as this case should not happen
  if (!users.length || !users[0]) return <h2>No users exist!</h2>;

  const titles = Object.keys(users[0])
    .map((x) => (x || "").toLocaleString())
    .concat(["Secretary general", "Teacher", "Delete Account"]);

  const rows = users.map((user) => {
    return Object.values(user)
      .map((u, i) => <p key={i}>{u?.toLocaleString()}</p>)
      .concat([
        <Checkbox
          key={users.length}
          checked={user.role === UserRole.SECRETARY_GENERAL}
        />,
        <Checkbox
          key={users.length + 1}
          checked={user.role === UserRole.TEACHER}
        />,
        <Button key={users.length + 2} variant="destructive">
          DELETE
        </Button>,
      ]);
  });

  const exclude = ["updatedAt", "id", "emailVerified", "image"];
  return <TypographyTable titles={titles} rows={rows} exclude={exclude} />;
}

export default Dashboard;
