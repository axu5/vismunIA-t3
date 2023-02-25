import Link from "next/link";
import { Button } from "@/components/ui/button";
import TypographyH1 from "@/components/ui/TypographyH1";
import TypographyP from "@/components/ui/TypographyP";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/NavigationMenu";
import { useMemo } from "react";
import * as React from "react";
import TypographyH2 from "./ui/TypographyH2";
import TypographyH3 from "./ui/TypographyH3";

const Navbar = () => {
  const { data: session, status } = useSession();
  const role = useMemo(() => {
    return session?.user.role;
  }, [session]);

  return (
    <>
      <div className="flex flex-row justify-between">
        <div className="flex">
          <Link href="/">
            <TypographyH1 title="VIS MUN" />
          </Link>
        </div>
        <div>
          {status !== "authenticated" ? (
            <div>
              <Link href="/api/auth/signin">
                <Button variant="default">Sign in with Google</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-row">
              <div className="flex flex-row">
                {/* <Avatar className="">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback>{session.user.name}</AvatarFallback>
                </Avatar> */}
                <TypographyH3
                  className="inline-block align-middle"
                  title={`Welcome ${session.user.name as string}`}
                />
              </div>
              <div>
                <Link href="/api/auth/signout">
                  <Button variant="subtle">Log out</Button>
                </Link>
                {(role === "SECRETARY_GENERAL" || role === "TEACHER") && (
                  <Link href="/dashboard">
                    <Button variant="subtle">Admin dashboard</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
