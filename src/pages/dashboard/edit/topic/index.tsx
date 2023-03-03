import UserAllowed from "@/components/UserAllowed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import TypographyH1 from "@/components/ui/TypographyH1";
import TypographyH4 from "@/components/ui/TypographyH4";
import TypographyTable from "@/components/ui/TypographyTable";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/utils/api";
import { type Topic } from "@prisma/client";
import Link from "next/link";
import type { NextPage } from "next/types";
import { type FormEvent, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Dashboard: NextPage = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const utils = api.useContext();
  const allTopics = api.topics.getAll.useQuery();

  const topicApi = api.topics.create.useMutation({
    onSuccess(_data, variables) {
      toast({
        title: `Successfully created a new topic`,
        description: `Created topic named ${variables.title}`,
      });
      topicApi.reset();
    },
    onError(data) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: `Could not finish creating topic due to ${data.message}`,
      });
    },
    async onSettled() {
      await utils.topics.getAll.invalidate();
    },
  });
  const deletion = api.topics.delete.useMutation({
    async onSuccess(data) {
      toast({
        title: `Deleted topic successfully`,
        description: `Deleted topic named ${data.title}`,
      });
      await utils.topics.getAll.invalidate();
    },
  });

  function deleteMe(topic: Topic) {
    return () => {
      deletion.mutate(topic.id);
    };
  }

  function createNewTopic(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTitle("");
    setDescription("");
    topicApi.mutate({
      title,
      description,
    });
  }

  return (
    <UserAllowed allowed={["SECRETARY_GENERAL", "TEACHER"]}>
      <TypographyH1 title="Create a new Topic" />
      <form className="flex flex-col" onSubmit={createNewTopic}>
        <TypographyH4 title="Topic name (required)" />
        <Input
          type="text"
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          value={title}
          placeholder="Enter a topic name..."
          required={true}
        />
        <Label htmlFor="description">Topic description</Label>
        <Textarea
          id="description"
          placeholder="Topic description"
          onChange={(e) => setDescription(e.target.value)}
          value={description}
        />
        {/* <Link href="/dashboard/edit/lesson">
          <Button variant="link" type="button">
            Create a new lesson <Plus />
          </Button>
        </Link> */}
        <Button type="submit" variant="default">
          Create new topic
        </Button>
      </form>
      {allTopics.isSuccess && (
        <ListTopics topics={allTopics.data} deleteMe={deleteMe} />
      )}
    </UserAllowed>
  );
};

function ListTopics({
  topics,
  deleteMe,
}: {
  topics: Topic[] | undefined;
  deleteMe: (_: Topic) => () => void;
}) {
  if (topics === undefined || topics.length === 0) {
    return <h1>No topics found</h1>;
  }

  const titles = Object.keys(topics[0] || {}).concat(["Edit", "Delete"]);
  const rows = topics.map((topic) => {
    return Object.values(topic)
      .map((s, i) => {
        return <p key={i}>{s.toLocaleString()}</p>;
      })
      .concat([
        <Link
          key={titles.length - 2}
          href={`/dashboard/edit/topic/${topic.id}`}
        >
          <Button variant={"default"}>Edit</Button>
        </Link>,
        <Button
          onClick={deleteMe(topic)}
          key={titles.length - 1}
          variant="destructive"
        >
          Delete
        </Button>,
      ]);
  });
  const exclude = ["id"];

  return <TypographyTable titles={titles} rows={rows} exclude={exclude} />;
}

export default Dashboard;
