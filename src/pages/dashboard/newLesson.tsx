import UserAllowed from "@/components/UserAllowed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import TypographyH1 from "@/components/ui/TypographyH1";
import TypographyH4 from "@/components/ui/TypographyH4";
import TypographyTable from "@/components/ui/TypographyTable";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/ui/use-toast";
import { api } from "@/utils/api";
import type { Lesson } from "@prisma/client";
import Link from "next/link";
import type { NextPage } from "next/types";
import { type FormEvent, useState } from "react";

const Dashboard: NextPage = () => {
  // use state hell
  const [location, setLocation] = useState("");
  const [day, setDay] = useState(0);
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(0);
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [topic, setTopic] = useState("");
  const utils = api.useContext();

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
    },
  });
  function deleteMe(lesson: Lesson) {
    return () => {
      deleter.mutate(lesson.id);
    };
  }

  const creator = api.lessons.create.useMutation({
    async onSuccess() {
      await utils.lessons.invalidate();
    },
  });
  function createNewSession(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // try to set date
    try {
      // make sure date is in future
      const date = new Date();
      date.setFullYear(year);
      date.setMonth(month - 1);
      date.setDate(day);
      date.setHours(hour);
      date.setMinutes(minute);
      date.setSeconds(0);
      date.setMilliseconds(0);

      if (date.getTime() <= Date.now()) throw "Date must be in the future";
      const obj = {
        location,
        date,
        topicId: topic,
      };
      console.log("OBJ", obj);
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
      <TypographyH1 title="New Session" />
      {/* TODO: COULD BE BETTER FROM UX */}
      <form onSubmit={createNewSession}>
        <TypographyH4 title="Location" />
        <Input
          type="text"
          onChange={(e) => {
            setLocation(e.target.value);
          }}
          placeholder="Where is this session going to be held?"
          required={true}
        />
        <TypographyH4 title="Select a date and time" />
        <div>
          <Input
            type="text"
            inputMode="numeric" // for phones
            onChange={(e) => {
              const number = Number(e.target.value);
              if (isNaN(number)) return;
              setDay(number);
            }}
            placeholder="Day"
            required={true}
          />
          <Input
            type="text"
            inputMode="numeric" // for phones
            onChange={(e) => {
              const number = Number(e.target.value);
              if (isNaN(number)) return;
              setMonth(number);
            }}
            placeholder="Month"
            required={true}
          />
          <Input
            type="text"
            inputMode="numeric" // for phones
            onChange={(e) => {
              const number = Number(e.target.value);
              if (isNaN(number)) return;
              setYear(number);
            }}
            placeholder="Year"
            required={true}
          />
          <Input
            type="text"
            inputMode="numeric" // for phones
            onChange={(e) => {
              const number = Number(e.target.value);
              if (isNaN(number)) return;
              setHour(number);
            }}
            placeholder="Hour"
            required={true}
          />
          <Input
            type="text"
            inputMode="numeric" // for phones
            onChange={(e) => {
              const number = Number(e.target.value);
              if (isNaN(number)) return;
              setMinute(number);
            }}
            placeholder="Minute"
            required={true}
          />
        </div>
        <TypographyH4 title="Select the topic this relates to" />
        {allTopics.isSuccess &&
          (allTopics.data.length === 0 ? (
            <Link href="/dashboard/newTopic">
              <Button variant="link">No topics found CLICK HERE</Button>
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
        <Button type="submit" variant="default">
          Create new session
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
  if (!lessons || lessons.length === 0) return <h1>No sessions found</h1>;

  const titles = Object.keys(lessons[0] || {}).concat(["Edit", "Delete"]);
  const rows = lessons.map((lesson) => {
    return Object.values(lesson)
      .map((lessonValue, i) => {
        return <p key={i}>{lessonValue.toLocaleString()}</p>;
      })
      .concat([
        <Link
          key={titles.length - 2}
          href={`/dashboard/edit/topic/${lesson.id}`}
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

  return <TypographyTable titles={titles} rows={rows} />;
}

export default Dashboard;
