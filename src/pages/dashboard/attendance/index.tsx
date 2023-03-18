import UserAllowed from "@/components/UserAllowed";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/utils/api";
import isBefore from "date-fns/isBefore";
import { FileDown } from "lucide-react";
import { type FormEvent, useRef } from "react";

export default function Attendance() {
  const attendance = api.lessons.getAttendanceData.useMutation({
    onSuccess(data) {
      const { users, lessons } = data;

      const usersAlphabeticalLastName = users.sort((a, b) => {
        const aLastName = a.name.split(" ")[1]?.toLowerCase();
        const bLastName = b.name.split(" ")[1]?.toLowerCase();

        if (aLastName == undefined || bLastName == undefined) return 0;

        if (aLastName < bLastName) {
          return -1;
        }
        return 1;
      });

      // make a 2d array of size users.length and lessons.length
      // where the lessons are the columns and users are the rows
      // add 2 to account for header and total count rows and columns
      const attendanceData = new Array(usersAlphabeticalLastName.length + 2)
        .fill(0)
        .map((_, i) => {
          const user = usersAlphabeticalLastName[i - 2];
          if (i === 0)
            return [
              "",
              "Date",
              ...lessons.map((lesson) => {
                if (lesson == undefined) return "";
                return lesson.dateStr;
              }),
            ];
          if (i === 1)
            return [
              "Student Name",
              "Attendance Count",
              ...lessons.map((lesson) => {
                if (lesson == undefined) return "";
                return lesson.attendance.length.toString();
              }),
            ];
          if (user === undefined) return [];
          return [user.name, `=SUM($C${i + 3}: $ZZ${i + 3})`].concat(
            ...lessons.map((lesson) => {
              return lesson.attendance.includes(user.id).toString();
            })
          );
        });

      const csv = attendanceData
        .map((row) => {
          return row.join(",");
        })
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const csvURL = window.URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = csvURL;
      tempLink.setAttribute("download", "filename.csv");
      tempLink.click();
      window.URL.createObjectURL(blob);
    },
  });
  const { toast } = useToast();
  const startMonthRef = useRef<HTMLInputElement>(null);
  const startYearRef = useRef<HTMLInputElement>(null);
  const endMonthRef = useRef<HTMLInputElement>(null);
  const endYearRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      if (
        startMonthRef === null ||
        startYearRef === null ||
        endMonthRef === null ||
        endYearRef === null ||
        startMonthRef.current === null ||
        startYearRef.current === null ||
        endMonthRef.current === null ||
        endYearRef.current === null
      )
        throw "Something went wrong";
      const startMonth = startMonthRef.current.value;
      const startYear = startYearRef.current.value;
      const endMonth = endMonthRef.current.value;
      const endYear = endYearRef.current.value;

      // make sure the inputs are numbers
      const startMonthNumber = Number(startMonth);
      const startYearNumber = Number(startYear);
      const endMonthNumber = Number(endMonth);
      const endYearNumber = Number(endYear);

      if (
        isNaN(startMonthNumber) ||
        isNaN(startYearNumber) ||
        isNaN(endMonthNumber) ||
        isNaN(endYearNumber)
      ) {
        throw "Please only input numbers";
      }

      // make sure months are between 1 and 12
      if (
        !(
          1 <= startMonthNumber &&
          startMonthNumber <= 12 &&
          1 <= endMonthNumber &&
          endMonthNumber <= 12
        )
      ) {
        throw "Months have to be between 1 and 12";
      }

      const startDate = new Date().setFullYear(
        startYearNumber,
        startMonthNumber
      );
      const endDate = new Date().setFullYear(endYearNumber, endMonthNumber);

      // make sure start is before end
      if (!isBefore(startDate, endDate)) {
        throw "Start has to be before end";
      }

      attendance.mutate({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } catch (e) {
      toast({
        title: e as string,
        variant: "destructive",
      });
    }
  }

  return (
    <UserAllowed allowed={["TEACHER"]}>
      <form onSubmit={handleSubmit}>
        <Label htmlFor="start-month">Start month</Label>
        <Input
          id="start-month"
          inputMode="numeric" // for phones
          ref={startMonthRef}
          placeholder="Start month (1-12)"
          required={true}
        />
        <Label htmlFor="start-year">Start year</Label>
        <Input
          id="start-year"
          inputMode="numeric" // for phones
          ref={startYearRef}
          placeholder="Start year"
          required={true}
        />
        <Label htmlFor="end-month">End month</Label>
        <Input
          id="end-month"
          inputMode="numeric" // for phones
          ref={endMonthRef}
          placeholder="End month (1-12)"
          required={true}
        />
        <Label htmlFor="end-year">End year</Label>
        <Input
          id="end-year"
          inputMode="numeric" // for phones
          ref={endYearRef}
          placeholder="End year"
          required={true}
        />
        <Button>
          Get attendance <FileDown className="mx-2 h-2 w-2" />
        </Button>
      </form>
    </UserAllowed>
  );
}
