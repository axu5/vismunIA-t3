import checkRoles from "@/utils/clientCheckRole";
import { type UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { type FC, type ReactNode } from "react";

interface UserAllowedComponent {
  allowed: UserRole[];
  children: ReactNode;
}

const UserAllowed: FC<UserAllowedComponent> = ({ allowed, children }) => {
  const { data, status } = useSession();
  if (status !== "authenticated") {
    return <h1>Loading...</h1>;
  } else if (!checkRoles(data.user.role, allowed)) {
    return <></>;
  } else {
    return (
      <>
        <Link href="/dashboard">Go to admin dashboard</Link>
        {children}
      </>
    );
  }
};

export default UserAllowed;
