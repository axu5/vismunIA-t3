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
    {
      title: "View attendance",
      description: "View and download the attendance data for all the students",
      href: "attendance",
    },
  ];
  return (
    <>
      <UserAllowed allowed={["SECRETARY_GENERAL", "TEACHER"]}>
        <TypographyH1 title="Secretary General options" />
        <ShowContent content={secretaryGeneralContent} />
        <UserAllowed allowed={["TEACHER"]} redirect={false}>
          <TypographyH1 title="Teacher options" />
          <ShowContent content={teacherContent} />
        </UserAllowed>
      </UserAllowed>
    </>
  );
};

function ShowContent({ content }: { content: linkType[] }) {
  return (
    <ul>
      {content.map((cont) => {
        return (
          <li key={cont.title}>
            <Link
              className="rounded shadow hover:underline"
              href={`/dashboard/${cont.href}`}
            >
              <TypographyH3 title={cont.title} />
              <p>{cont.description}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default Dashboard;
