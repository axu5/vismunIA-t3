import UserAllowed from "@/components/UserAllowed";
import { Button } from "@/components/ui/Button";
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
    onSuccess(data) {
      toast({
        title: `Deleted topic successfully`,
        description: `Deleted topic named ${data.title}`,
      });
    },
    async onSettled() {
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
    topicApi.mutate({
      title,
      description,
    });
  }

  return (
    <UserAllowed allowed={["SECRETARY_GENERAL", "TEACHER"]}>
      <TypographyH1 title="Create a new Topic" />
      <form onSubmit={createNewTopic}>
        <TypographyH4 title="Topic name" />
        <Input
          type="text"
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          value={title}
          placeholder="Enter a topic name..."
        />
        <TypographyH4 title="Topic description" />
        <Input
          type="text"
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          value={description}
          placeholder="Enter a topic description..."
        />
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

  return <TypographyTable titles={titles} rows={rows} />;
}

export default Dashboard;
