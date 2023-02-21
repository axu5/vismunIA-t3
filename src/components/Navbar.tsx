import Link from "next/link";
import { Button } from "./ui/Button";
import TypographyH1 from "./ui/TypographyH1";
import { useSession } from "next-auth/react";
import TypographyP from "./ui/TypographyP";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/Avatar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/NavigationMenu";
import { useMemo } from "react";
import React from "react";
import { cn } from "@/utils/cn";

const Navbar = () => {
  const { data: session, status } = useSession();
  const privilege = useMemo(() => {
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
          {(privilege === "SECRETARY_GENERAL" || privilege === "TEACHER") && (
            <SecretaryGeneralOptions />
          )}
          {privilege === "TEACHER" && <TeacherOptions />}
        </NavigationMenuList>
      </NavigationMenu>
    </>
  );
};

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-slate-500 dark:text-slate-400">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

function SecretaryGeneralOptions() {
  const components: { title: string; href: string; description: string }[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      description:
        "A dashboard for secretary generals and teachers to set and edit events",
    },
    {
      title: "Create a new Topic",
      href: "/dashboard/newTopic",
      description:
        "To start a new topic click here, and fill in the form. Then create sessions with this topic to show for students.",
    },
    {
      title: "Create a new Session",
      href: "/dashboard/newSession",
      description:
        "To create a session/ lesson click here, and fill in the form. This will make a timed session that will make it easy to manage files and share things with the students.",
    },
  ];
  return (
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger>
          Secretary General settings
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
            {components.map((component) => (
              <ListItem
                key={component.title}
                title={component.title}
                href={component.href}
              >
                {component.description}
              </ListItem>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  );
}

function TeacherOptions() {
  const components: { title: string; href: string; description: string }[] = [
    {
      title: "Change secretary generals",
      href: "/dashboard/setSecretaryGenerals",
      description: "Set new secretary generals or remove the old ones.",
    },
  ];
  return (
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Teacher settings</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
            {components.map((component) => (
              <ListItem
                key={component.title}
                title={component.title}
                href={component.href}
              >
                {component.description}
              </ListItem>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  );
}

export default Navbar;
