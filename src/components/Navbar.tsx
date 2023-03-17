import Link from "next/link";
import { Button } from "@/components/ui/button";
import TypographyH1 from "@/components/ui/TypographyH1";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import * as React from "react";
import TypographyH3 from "./ui/TypographyH3";
import { Lock, LogIn, LogOut } from "lucide-react";

const Navbar = () => {
  const { data: session, status } = useSession();
  const role = useMemo(() => {
    return session?.user.role;
  }, [session]);

  return (
    <>
      <div className="mx-auto flex w-4/5 flex-row justify-between">
        <div className="flex">
          <Link href="/">
            <TypographyH1 title="VIS MUN" />
          </Link>
        </div>
        <div>
          {status !== "authenticated" ? (
            <div>
              <Link href="/api/auth/signin">
                <Button variant="default">
                  Sign in with Google
                  <LogIn className="mx-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-row">
              <div className="flex flex-row">
                <TypographyH3
                  className=""
                  title={`Welcome ${session.user.name as string}`}
                />
              </div>
              <div>
                <Link href="/api/auth/signout">
                  <Button variant="subtle">
                    Log out
                    <LogOut className="mx-2 h-4 w-4" />
                  </Button>
                </Link>
                {(role === "SECRETARY_GENERAL" || role === "TEACHER") && (
                  <Link href="/dashboard">
                    <Button variant="subtle">
                      Admin dashboard <Lock className="mx-2 h-4 w-4" />
                    </Button>
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
