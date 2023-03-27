import { useToast } from "@/hooks/ui/use-toast";
import checkRoles from "@/utils/clientCheckRole";
import { type UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { type FC, type ReactNode } from "react";

interface UserAllowedComponent {
  allowed: UserRole[];
  children: ReactNode;
  redirect?: boolean;
}

const UserAllowed: FC<UserAllowedComponent> = ({
  allowed,
  children,
  redirect,
}) => {
  if (redirect == undefined) redirect = true;
  const { data, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  if (status !== "authenticated" || !router.isReady) {
    return <h1>Loading...</h1>;
  } else if (!checkRoles(data.user.role, allowed)) {
    if (redirect)
      router.push("/").then(() => {
        toast({
          title: "You are not authorized to access that page",
          variant: "destructive",
        });
      });
    return <></>;
  } else {
    return <>{children}</>;
  }
};

export default UserAllowed;
