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
import { type ReactNode, useMemo, useState } from "react";

export function getServerSideProps(context: GetServerSidePropsContext) {
  const { lessonId } = context.query;

  if (!lessonId || typeof lessonId !== "string") {
    return {
      redirect: {
        permanent: false,
        destination: "/dashboard",
      },
    };
  }

  return {
    props: {
      lessonId,
    },
  };
}

export default function Attendance({
  lessonId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: lessons, isLoading: isLoadingLessons } =
    api.lessons.getById.useQuery(lessonId, {
      refetchOnWindowFocus: false,
    });
  const [localAttendance, setLocalAttendance] = useState<Map<string, boolean>>(
    new Map()
  );
  const { data: students, isLoading: isLoadingStudents } =
    api.users.getUsersByRole.useQuery(["STUDENT", "SECRETARY_GENERAL"], {
      refetchOnWindowFocus: false,
    });
  const { data: attendance, isLoading: isLoadingAttendance } =
    api.users.getAttendance.useQuery(lessonId, {
      onSuccess(data) {
        setLocalAttendance(data);
      },
      refetchOnWindowFocus: false,
    });
  const attendanceMutator = api.users.setAttendance.useMutation({});

  const titles = [<>Name</>, <>Present</>, <>Absent</>];
  const rows = useMemo(() => {
    if (students == undefined || attendance == undefined) {
      return [[]] as ReactNode[][];
    }

    const toggleAttendance = (student: User) => {
      return () => {
        const present = !localAttendance.get(student.id);
        attendanceMutator.mutate({
          userId: student.id,
          lessonId,
          present,
        });
        localAttendance.set(student.id, present);
      };
    };

    return students
      .sort((a, b) => {
        const aLastName = a.name.split(/ +/g)[1] || "";
        const bLastName = b.name.split(/ +/g)[1] || "";
        return aLastName < bLastName ? -1 : 1;
      })
      .map((student) => {
        const attended = attendance.get(student.id);
        return [
          <div key={0}>{student.name}</div>,
          <Button
            key={1}
            onClick={() => void toggleAttendance(student)()}
            variant="ghost"
            className={attended ? "bg-green-300" : ""}
            disabled={attended}
          >
            Present
          </Button>,
          <Button
            key={2}
            onClick={() => void toggleAttendance(student)()}
            variant="ghost"
            className={attended ? "" : "bg-red-300"}
            disabled={!attended}
          >
            Absent
          </Button>,
        ];
      });
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
