import UserAllowed from "@/components/UserAllowed";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import TypographyH1 from "@/components/ui/TypographyH1";
import TypographyH4 from "@/components/ui/TypographyH4";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/ui/use-toast";
import { api } from "@/utils/api";
import type { MUNSession, Topic } from "@prisma/client";
import Link from "next/link";
import type { NextPage } from "next/types";
import { type FormEvent, useState } from "react";
import CalendarComponent from "@/components/Calendar";

const Dashboard: NextPage = () => {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date());
  const [topic, setTopic] = useState<Topic | null>(null);
  const utils = api.useContext();

  const allSessions = api.sessions.getAll.useQuery();
  const allTopics = api.topics.getAll.useQuery();

  const deleter = api.sessions.delete.useMutation({
    async onSuccess() {
      await utils.sessions.invalidate();
    },
  });
  function deleteMe(session: MUNSession) {
    return () => {
      deleter.mutate(session.id);
    };
  }

  const creator = api.sessions.create.useMutation({
    async onSuccess() {
      await utils.sessions.invalidate();
    },
  });
  function createNewSession(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // try to set date
    try {
      // make sure date is in future
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
          value={location}
          placeholder="Where is this session going to be held?"
        />
        <CalendarComponent onChange={setDate} />
        <TypographyH4 title="Select the topic this relates to" />
        {allTopics.isSuccess &&
          (allTopics.data.length === 0 ? (
            <Link href="/dashboard/newTopic">
              <Button variant="destructive">No topics found CLICK HERE</Button>
            </Link>
          ) : (
            <RadioGroup defaultValue={(allTopics.data[0] || { id: "" }).id}>
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
      {allSessions.isSuccess && (
        <ListAllSessions deleteMe={deleteMe} sessions={allSessions.data} />
      )}
    </UserAllowed>
  );
};

function ListAllSessions({
  sessions,
  deleteMe,
}: {
  sessions: MUNSession[];
  deleteMe: (_: MUNSession) => () => void;
}) {
  if (!sessions || sessions.length === 0) return <h1>No sessions found</h1>;

  const titles = Object.keys(sessions[0] || {}).concat(["Edit", "Delete"]);
  const rows = sessions.map((session) => {
    return Object.values(session)
      .map((s, i) => {
        return <p key={i}>{s.toLocaleString()}</p>;
      })
      .concat([
        <Link
          key={titles.length - 2}
          href={`/dashboard/edit/topic/${session.id}`}
        >
          <Button variant={"default"}>Edit</Button>
        </Link>,
        <Button
          onClick={deleteMe(session)}
          key={titles.length - 1}
          variant="destructive"
        >
          Delete
        </Button>,
      ]);
  });

  return <></>;
}

export default Dashboard;
