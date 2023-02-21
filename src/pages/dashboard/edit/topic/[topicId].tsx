import type { NextPage } from "next/types";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import TypographyH4 from "@/components/ui/TypographyH4";
import { Button } from "@/components/ui/Button";
import { useState, type FormEvent } from "react";
import { TRPCError } from "@trpc/server";
import { useToast } from "@/hooks/ui/use-toast";

const TopicEditor: NextPage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { topicId } = router.query;
  const _topicId = typeof topicId === "string" ? topicId : "";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const topic = api.topics.getById.useQuery(_topicId, {
    onSuccess(data) {
      if (!data) return;
      if (data instanceof TRPCError) return;
      setTitle(data.title);
      setDescription(data.description);
    },
  });
  const deleter = api.topics.delete.useMutation({
    async onSuccess() {
      await router.push("/dashboard/newTopic");
    },
  });
  function deleteMe() {
    deleter.mutate(_topicId);
  }

  const editor = api.topics.edit.useMutation({
    onSuccess(data) {
      toast({
        title: `Successfully updated the topic`,
        description: `Updated the title to ${data.title}`,
      });
    },
  });
  function editMe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Get new title
    editor.mutate({
      id: _topicId,
      title,
      description,
    });
  }

  if (topic.isLoading) return <h1>Loading...</h1>;
  if (topic.isError) return <h1>{topic.error.message}</h1>;
  if (topic.isSuccess) {
    return (
      <div>
        <Link href="/dashboard/newTopic">Go back</Link>
        <form onSubmit={editMe}>
          <TypographyH4 title="TOPIC TITLE" />
          <Input
            value={title}
            type="text"
            placeholder="Topic title"
            onChange={(e) => setTitle(e.target.value)}
          />
          <TypographyH4 title="TOPIC TITLE" />
          <Input
            value={description}
            type="text"
            placeholder="Topic description"
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button variant="destructive" type="button" onClick={deleteMe}>
            Delete this topic
          </Button>
          <Button type="submit">Save changes</Button>
        </form>
      </div>
    );
  }
  return <>Something went wrong</>;
};

export default TopicEditor;
