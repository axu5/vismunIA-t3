import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next/types";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import TypographyH4 from "@/components/ui/TypographyH4";
import { Button } from "@/components/ui/button";
import { type FormEvent, useRef, useState, useEffect } from "react";
import { useToast } from "@/hooks/ui/use-toast";
import Loading from "@/components/Loading";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Topic } from "@prisma/client";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { createInnerTRPCContext } from "@/server/api/trpc";
import { appRouter } from "@/server/api/root";
import superjson from "superjson";
import { getSession } from "next-auth/react";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);
  if (session === null) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const { topicId } = context.query;

  if (typeof topicId !== "string") {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: createInnerTRPCContext({ session: null }),
    transformer: superjson, // optional - adds superjson serialization
  });

  await ssg.topics.getById.prefetch(topicId);

  return {
    props: {
      trpcState: ssg.dehydrate(),
      topicId: topicId,
    },
  };
}

const TopicEditor: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ topicId }) => {
  const { toast } = useToast();
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const topic = api.topics.getById.useQuery(topicId, {
    onSuccess(topic) {
      if (titleRef.current != undefined) {
        titleRef.current.value = topic.title;
      }
      if (descriptionRef.current != undefined)
        descriptionRef.current.value = topic.description;
    },
    refetchOnWindowFocus: false,
  });
  if (topic.data == undefined) return <Loading />;
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
    deleter.mutate(topicId);
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
      id: topicId,
      title: titleRef.current.value,
      description: descriptionRef.current.value,
    });
  }

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
};

export default TopicEditor;
