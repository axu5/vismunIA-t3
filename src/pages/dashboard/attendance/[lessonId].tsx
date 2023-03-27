import Loading from "@/components/Loading";
import UserAllowed from "@/components/UserAllowed";
import TypographyH1 from "@/components/ui/TypographyH1";
import TypographyTable from "@/components/ui/TypographyTable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/ui/use-toast";
import { getServerAuthSession } from "@/server/auth";
import { api } from "@/utils/api";
import { User, UserRole } from "@prisma/client";
import { Save } from "lucide-react";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { type ReactNode, useMemo, useState, useEffect } from "react";
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

  const session = await getServerAuthSession(context);

  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: createInnerTRPCContext({ session }),
    transformer: superjson, // optional - adds superjson serialization
  });

  await ssg.users.getAttendance.prefetch(lessonId);
  await ssg.users.getUsersByRole.prefetch([
    UserRole.STUDENT,
    UserRole.SECRETARY_GENERAL,
  ]);

  return {
    props: {
      trpcState: ssg.dehydrate(),
      lessonId,
    },
  };
}

export default function Attendance({
  lessonId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [localAttendance, setLocalAttendance] = useState<Set<string>>(
    new Set()
  );
  const { toast } = useToast();

  api.users.getAttendance.useQuery(lessonId, {
    onSuccess(data) {
      setLocalAttendance(new Set(data));
    },
  });
  const { data: students } = api.users.getUsersByRole.useQuery([
    UserRole.STUDENT,
    UserRole.SECRETARY_GENERAL,
  ]);

  const attendanceMutator = api.lessons.setAttendanceData.useMutation({
    onSuccess() {
      toast({
        title: "Saved attendance",
      });
    },
    onError() {
      toast({
        title: "Attendance failed",
      });
    },
  });

  function saveAttendance(state: Set<string>) {
    attendanceMutator.mutate({
      lessonId,
      users: Array.from(state),
    });
  }

  const titles = ["Name", "Present", "Absent"];

  if (students == undefined) {
    return (
      <UserAllowed allowed={[UserRole.TEACHER]}>
        <Loading />
      </UserAllowed>
    );
  }

  return (
    <UserAllowed allowed={[UserRole.TEACHER]}>
      <TypographyH1 title="Students" />
      <TypographyTable
        rows={students
          .sort((a, b) => {
            const aLastName = a.name.split(/ +/g)[1] || a.name;
            const bLastName = b.name.split(/ +/g)[1] || b.name;
            return aLastName.toLowerCase() < bLastName.toLowerCase() ? -1 : 1;
          })
          .map((student) => {
            const attended = localAttendance.has(student.id);
            return [
              <div key={0}>{student.name}</div>,
              <Button
                key={1}
                onClick={() => {
                  setLocalAttendance((prev) => {
                    prev.add(student.id);
                    saveAttendance(prev);
                    return prev;
                  });
                }}
                variant="ghost"
                className={attended ? "bg-green-300" : ""}
                disabled={attended}
              >
                Present
              </Button>,
              <Button
                key={2}
                onClick={() => {
                  setLocalAttendance((prev) => {
                    prev.delete(student.id);
                    saveAttendance(prev);
                    return prev;
                  });
                }}
                variant="ghost"
                className={attended ? "" : "bg-red-300"}
                disabled={!attended}
              >
                Absent
              </Button>,
            ];
          })}
        titles={titles}
      />
    </UserAllowed>
  );
}
