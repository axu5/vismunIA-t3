import { useToast } from "@/hooks/ui/use-toast";
import checkRoles from "@/utils/clientCheckRole";
import { type UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { type FC, type ReactNode } from "react";

interface UserAllowedComponent {
  allowed: UserRole[];
  children: ReactNode;
  redir?: boolean;
}

const UserAllowed: FC<UserAllowedComponent> = ({
  allowed,
  children,
  redir,
}) => {
  if (redir == undefined) redir = true;
  const { data, status } = useSession();
  const router = useRouter();
  if (status !== "authenticated" || !router.isReady) {
    return <h1>Loading...</h1>;
  } else if (!checkRoles(data.user.role, allowed)) {
    if (redir) router.push("/");
    return <></>;
  } else {
    return <>{children}</>;
  }
};

export default UserAllowed;
