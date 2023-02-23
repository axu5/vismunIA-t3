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

const Navbar = () => {
  const { data: session, status } = useSession();
  const role = useMemo(() => {
    return session?.user.role;
  }, [session]);

  return (
    <>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/">
              <TypographyH1 title="VIS MUN" />
            </Link>
          </NavigationMenuItem>
          {status !== "authenticated" ? (
            <NavigationMenuItem>
              <Link href="/api/auth/signin">
                <Button variant="default">Sign in with Google</Button>
              </Link>
            </NavigationMenuItem>
          ) : (
            <>
              <NavigationMenuItem>
                <TypographyP text={`Welcome ${session.user.name as string}`} />
                <Avatar>
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback>{session.user.name}</AvatarFallback>
                </Avatar>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/api/auth/signout">
                  <Button variant="subtle">Log out</Button>
                </Link>
              </NavigationMenuItem>
            </>
          )}
          {(role === "SECRETARY_GENERAL" || role === "TEACHER") && (
            <Link href="/dashboard">
              <Button variant="link">Admin dashboard</Button>
            </Link>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </>
  );
};

export default Navbar;
