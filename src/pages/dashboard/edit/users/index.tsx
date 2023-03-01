"use client";

import UserAllowed from "@/components/UserAllowed";
import { Button } from "@/components/ui/button";
import TypographyH1 from "@/components/ui/TypographyH1";
import TypographyTable from "@/components/ui/TypographyTable";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/utils/api";
import { type User, UserRole } from "@prisma/client";
import type { NextPage } from "next/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Dashboard: NextPage = () => {
  const { data: users, isLoading } = api.users.getAll.useQuery();

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

  // react hooks must be called unconditionally
  const { toast } = useToast();

  // Could throw an exception as this case should not happen
  if (!users.length || !users[0]) return <h2>No users exist!</h2>;

  const utils = api.useContext();
  const deleter = api.users.delete.useMutation({
    async onSuccess(data) {
      await utils.users.invalidate();
      toast({
        title: "Deleted user successfully",
        description: `Student ${data.name} has been deleted`,
      });
    },
  });
  const updateRole = api.users.updateRole.useMutation({
    async onSuccess(data) {
      await utils.users.invalidate();
      toast({
        title: "Role updated successfully",
        description: `${data.role} has been granted for ${data.name}`,
      });
    },
  });

  function deleteUser(user: User) {
    return () => {
      deleter.mutate(user.id);
    };
  }

  function updateUserRole(user: User) {
    return (role: UserRole) => {
      updateRole.mutate({
        id: user.id,
        role,
      });
    };
  }

  const titles = Object.keys(users[0])
    .map((x) => (x || "").toLocaleString())
    .concat(["Delete Account"]);

  const rows = users.map((user) => {
    const row = Object.values(user)
      .map((u, i) => <p key={i}>{u?.toLocaleString()}</p>)
      .concat([
        <Button
          onClick={deleteUser(user)}
          key={users.length + 1}
          variant="destructive"
        >
          DELETE
        </Button>,
      ]);

    row[6] = (
      <DropdownMenu key={7}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{user.role}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Change role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={user.role}
            onValueChange={(role) => {
              // create a prompt if a teacher is being updated
              if (user.role === "TEACHER") {
                const result = confirm(
                  `Are you sure you want to remove teacher role for ${user.name}`
                );
                if (result !== true) return;
              }
              updateUserRole(user)(role as UserRole);
            }}
          >
            <DropdownMenuRadioItem value={UserRole.STUDENT}>
              STUDENT
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={UserRole.SECRETARY_GENERAL}>
              SECRETARY GENERAL
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={UserRole.TEACHER}>
              TEACHER
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    return row;
  });

  const exclude = ["updatedAt", "id", "emailVerified", "image", "attendance"];
  return <TypographyTable titles={titles} rows={rows} exclude={exclude} />;
}

export default Dashboard;
