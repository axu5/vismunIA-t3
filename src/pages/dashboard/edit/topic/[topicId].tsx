import type { NextPage } from "next/types";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import TypographyH4 from "@/components/ui/TypographyH4";
import { Button } from "@/components/ui/button";
import { type FormEvent, useRef } from "react";
import { useToast } from "@/hooks/ui/use-toast";
import Loading from "@/components/Loading";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const TopicEditor: NextPage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { topicId } = router.query;
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const _topicId = typeof topicId === "string" ? topicId : "";
  const topic = api.topics.getById.useQuery(_topicId, {
    onSuccess(data) {
      if (titleRef.current != undefined) {
        titleRef.current.value = data.title;
      }
      if (descriptionRef.current != undefined)
        descriptionRef.current.value = data.description;
    },
  });
  const deleter = api.topics.delete.useMutation({
    async onSuccess() {
      await router.push("/dashboard/edit/topic");
    },
    onError(error) {
      toast({
        title: "An unexpected error occurred",
        description: error.message,
        variant: "destructive",
      });
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
    if (descriptionRef.current == undefined || titleRef.current == undefined)
      return;
    // Get new title
    editor.mutate({
      id: _topicId,
      title: titleRef.current.value,
      description: descriptionRef.current.value,
    });
  }

  if (topic.isLoading) return <Loading />; //<h1>Loading...</h1>;
  if (topic.isError) return <h1>{topic.error.message}</h1>;
  if (topic.isSuccess) {
    return (
      <div>
        <Link href="/dashboard/edit/topic">Go back</Link>
        <form className="flex flex-col" onSubmit={editMe}>
          <TypographyH4 title="Topic title" />
          <Input
            ref={titleRef}
            type="text"
            placeholder="Topic title"
            required={true}
          />
          <Label htmlFor="description">Topic description</Label>
          <Textarea
            ref={descriptionRef}
            id="description"
            placeholder="Topic description"
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
