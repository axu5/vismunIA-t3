import UserAllowed from "@/components/UserAllowed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import TypographyH1 from "@/components/ui/TypographyH1";
import TypographyH4 from "@/components/ui/TypographyH4";
import TypographyTable from "@/components/ui/TypographyTable";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/utils/api";
import type { Lesson } from "@prisma/client";
import Link from "next/link";
import type { NextPage } from "next/types";
import { type FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/router";

const NewLesson: NextPage = () => {
  const { toast } = useToast();
  // use state hell
  const [location, setLocation] = useState("");
  const [day, setDay] = useState(0);
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(0);
  const [topic, setTopic] = useState("");

  const utils = api.useContext();
  const router = useRouter();

  const allLessons = api.lessons.getAll.useQuery();
  const allTopics = api.topics.getAll.useQuery(undefined, {
    onSuccess(data) {
      if (!data[0]) return;
      setTopic(data[0].id);
    },
  });

  const deleter = api.lessons.delete.useMutation({
    async onSuccess() {
      await utils.lessons.invalidate();
      setLocation("");
    },
  });
  const creator = api.lessons.create.useMutation({
    async onSuccess() {
      setLocation("");
      setDay(0);
      setMonth(0);
      setYear(0);
      await utils.lessons.invalidate();
      toast({
        title: "Successfully created lesson",
      });
    },
    onError() {
      toast({
        title: "Failed to create lesson",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const { y, m, d } = router.query;
    if (y && m && d) {
      setYear(Number(y));
      setMonth(Number(m));
      setDay(Number(d));
    }
  }, [router.query]);

  function deleteMe(lesson: Lesson) {
    return () => {
      deleter.mutate(lesson.id);
    };
  }

  function createNewLesson(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // try to set date
    try {
      // make sure date is in future
      const date = new Date();
      date.setFullYear(year);
      date.setMonth(month - 1);
      date.setDate(day);

      // this validation is not required
      //   if (date.getTime() <= Date.now()) throw "Date must be in the future";
      const obj = {
        location,
        date,
        topicId: topic,
      };
      creator.mutate(obj);
    } catch (e) {
      toast({
        title: "Error setting date",
        description: `Check that your date is correct \n${e as string}`,
        variant: "destructive",
      });
    }
  }

  return (
    <UserAllowed allowed={["SECRETARY_GENERAL", "TEACHER"]}>
      <TypographyH1 title="Create a new Lesson" />
      {/* TODO: COULD BE BETTER FROM UX */}
      <form onSubmit={createNewLesson}>
        <TypographyH4 title="Location" />
        <Input
          type="text"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
          }}
          placeholder="Where is this lesson going to be held?"
          required={true}
        />
        <TypographyH4 title="Select a date and time" />
        <div>
          <Label htmlFor="day">Day</Label>
          <Input
            type="text"
            id="day"
            value={day}
            inputMode="numeric" // for phones
            onChange={(e) => {
              const number = Number(e.target.value);
              if (isNaN(number)) return;
              setDay(number);
            }}
            placeholder="Day"
            required={true}
          />
          <Label htmlFor="month">Month</Label>
          <Input
            type="text"
            id="day"
            value={month}
            inputMode="numeric" // for phones
            onChange={(e) => {
              const number = Number(e.target.value);
              if (isNaN(number)) return;
              setMonth(number);
            }}
            placeholder="Month"
            required={true}
          />
          <Label htmlFor="year">Year</Label>
          <Input
            type="text"
            id="year"
            value={year}
            inputMode="numeric" // for phones
            onChange={(e) => {
              const number = Number(e.target.value);
              if (isNaN(number)) return;
              setYear(number);
            }}
            placeholder="Year"
            required={true}
          />
        </div>
        <TypographyH4 title="Select the topic this relates to" />
        {allTopics.isSuccess &&
          (allTopics.data.length === 0 ? (
            <Link href="/dashboard/edit/topic">
              <Button variant="destructive">No topics found CLICK HERE</Button>
            </Link>
          ) : (
            <RadioGroup
              onChange={(e) => {
                const target = e.target as HTMLInputElement;
                const topicId = target.value;
                setTopic(topicId);
              }}
              defaultValue={(allTopics.data[0] || { id: "" }).id}
            >
              {allTopics.data.map((topic, i) => {
                return (
                  <div key={i} className="flex items-center space-x-2">
                    <RadioGroupItem value={topic.id} id={topic.id} />
                    <Label htmlFor={topic.id}>{topic.title}</Label>
                  </div>
                );
              })}
            </RadioGroup>
          ))}
        <Button
          type="submit"
          variant={
            allTopics != undefined &&
            allTopics.data != undefined &&
            allTopics.data.length > 0
              ? "default"
              : "disabled"
          }
        >
          Create new lesson
        </Button>
      </form>
      {allLessons.isSuccess && (
        <ListAllLessons deleteMe={deleteMe} lessons={allLessons.data} />
      )}
    </UserAllowed>
  );
};

function ListAllLessons({
  lessons,
  deleteMe,
}: {
  lessons: Lesson[];
  deleteMe: (_: Lesson) => () => void;
}) {
  if (!lessons || lessons.length === 0) return <h1>No lessons found</h1>;

  const titles = Object.keys(lessons[0] || {}).concat(["Edit", "Delete"]);
  const rows = lessons.map((lesson) => {
    return Object.values(lesson)
      .map((lessonValue, i) => {
        return <p key={i}>{lessonValue.toLocaleString()}</p>;
      })
      .concat([
        <Link
          key={titles.length - 2}
          href={`/dashboard/edit/lesson/${lesson.id}`}
        >
          <Button variant={"default"}>Edit</Button>
        </Link>,
        <Button
          onClick={deleteMe(lesson)}
          key={titles.length - 1}
          variant="destructive"
        >
          Delete
        </Button>,
      ]);
  });

  const exclude = ["id", "date", "attendance"];
  return <TypographyTable titles={titles} rows={rows} exclude={exclude} />;
}

export default NewLesson;
