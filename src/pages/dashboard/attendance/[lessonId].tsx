import Loading from "@/components/Loading";
import UserAllowed from "@/components/UserAllowed";
import TypographyH1 from "@/components/ui/TypographyH1";
import TypographyTable from "@/components/ui/TypographyTable";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import type { User } from "@prisma/client";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { type ReactNode, useEffect, useState } from "react";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { appRouter } from "@/server/api/root";
import { createInnerTRPCContext } from "@/server/api/trpc";
import superjson from "superjson";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { lessonId } = context.query;

  if (!lessonId || typeof lessonId !== "string") {
    return {
      redirect: {
        permanent: false,
        destination: "/dashboard",
      },
    };
  }

  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: createInnerTRPCContext({ session: null }),
    transformer: superjson, // optional - adds superjson serialization
  });

  //   await Promise.all([
  //     ssg.lessons.getById.prefetch(lessonId),
  //     ssg.users.getUsersByRole.prefetch(["STUDENT", "SECRETARY_GENERAL"]),
  //   ]);
  const previousAttendance = await ssg.users.getAttendance.fetch(lessonId);

  return {
    props: {
      //   trpcState: ssg.dehydrate(),
      previousAttendance,
      lessonId,
    },
  };
}

export default function Attendance({
  lessonId,
  previousAttendance,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: lessons, isLoading: isLoadingLessons } =
    api.lessons.getById.useQuery(lessonId, {});
  const [localAttendance, setLocalAttendance] =
    useState<Map<string, boolean>>(previousAttendance);
  const { data: students, isLoading: isLoadingStudents } =
    api.users.getUsersByRole.useQuery(["STUDENT", "SECRETARY_GENERAL"], {});
  const { data: attendance, isLoading: isLoadingAttendance } =
    api.users.getAttendance.useQuery(lessonId, {
      onSuccess(students) {
        setLocalAttendance(students);
      },
    });
  const attendanceMutator = api.users.setAttendance.useMutation();

  const titles = [<>Name</>, <>Present</>, <>Absent</>];
  const [rows, setRows] = useState<ReactNode[][]>([[]] as ReactNode[][]);
  useEffect(() => {
    if (students == undefined || attendance == undefined) {
      setRows([[]] as ReactNode[][]);
      return;
    }

    const toggleAttendance = (student: User) => {
      return () => {
        const present = !attendance.get(student.id);
        setLocalAttendance((prev) => {
          prev.set(student.id, present);
          return prev;
        });
        attendanceMutator.mutate({
          userId: student.id,
          lessonId,
          present,
        });
      };
    };

    setRows((_prev) =>
      students
        .sort((a, b) => {
          const aLastName = a.name.split(/ +/g)[1] || "";
          const bLastName = b.name.split(/ +/g)[1] || "";
          return aLastName < bLastName ? -1 : 1;
        })
        .map((student) => {
          const attended = localAttendance.get(student.id);
          return [
            <div key={0}>{student.name}</div>,
            <Button
              key={1}
              onClick={void toggleAttendance(student)}
              variant="ghost"
              className={attended ? "bg-green-300" : ""}
              disabled={attended}
            >
              Present
            </Button>,
            <Button
              key={2}
              onClick={void toggleAttendance(student)}
              variant="ghost"
              className={attended ? "" : "bg-red-300"}
              disabled={!attended}
            >
              Absent
            </Button>,
          ];
        })
    );
  }, [students, attendance, attendanceMutator, lessonId, localAttendance]);

  if (
    isLoadingLessons ||
    isLoadingStudents ||
    isLoadingAttendance ||
    lessons == undefined ||
    students == undefined ||
    attendance == undefined
  ) {
    return <Loading />;
  }
  return (
    <UserAllowed allowed={["TEACHER"]}>
      <TypographyH1 title="Students" />
      <TypographyTable rows={rows} titles={titles} />
    </UserAllowed>
  );
}
