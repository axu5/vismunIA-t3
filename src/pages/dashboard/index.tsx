import UserAllowed from "@/components/UserAllowed";
import TypographyH1 from "@/components/ui/TypographyH1";
import TypographyH3 from "@/components/ui/TypographyH3";
import Link from "next/link";
import type { NextPage } from "next/types";

type linkType = { title: string; description: string; href: string };

const Dashboard: NextPage = () => {
  const secretaryGeneralContent: linkType[] = [
    {
      title: "New Lesson",
      description: "Create a new lesson by clicking here",
      href: "edit/lesson",
    },
    {
      title: "New Topic",
      description: "Create a new MUN topic by clicking here",
      href: "edit/topic",
    },
  ];
  const teacherContent: linkType[] = [
    {
      title: "Set secretary generals",
      description: "Edit permissions of students",
      href: "edit/users",
    },
  ];
  return (
    <>
      <UserAllowed allowed={["SECRETARY_GENERAL", "TEACHER"]}>
        <TypographyH1 title="Secretary General options" />
        <ShowContent content={secretaryGeneralContent} />
      </UserAllowed>
      <UserAllowed allowed={["TEACHER"]}>
        <TypographyH1 title="Teacher options" />
        <ShowContent content={teacherContent} />
      </UserAllowed>
    </>
  );
};

function ShowContent({ content }: { content: linkType[] }) {
  return (
    <ul>
      {content.map((cont) => {
        return (
          <li
            className="m-4 rounded bg-slate-300 px-5 pb-2 hover:underline"
            key={cont.title}
          >
            <Link href={`/dashboard/${cont.href}`}>
              <TypographyH3 className="" title={cont.title} />
              <p>{cont.description}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default Dashboard;
