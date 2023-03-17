import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import Loading from "@/components/Loading";
import TypographyH1 from "@/components/ui/TypographyH1";
import TypographyH2 from "@/components/ui/TypographyH2";
import TypographyP from "@/components/ui/TypographyP";
import { api } from "@/utils/api";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { createInnerTRPCContext } from "@/server/api/trpc";
import { appRouter } from "@/server/api/root";
import superjson from "superjson";
import Link from "next/link";
import { Edit, ExternalLink, Plus, Trash, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession, useSession } from "next-auth/react";
import { z } from "zod";
import { useToast } from "@/hooks/ui/use-toast";
import { Input } from "@/components/ui/Input";
import { type FormEvent, useRef, useMemo, useState } from "react";
import TypographyTable from "@/components/ui/TypographyTable";
import checkRoles from "@/utils/clientCheckRole";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Country, Document, Position, Topic } from "@prisma/client";
import UserAllowed from "@/components/UserAllowed";

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

  const { lessonId } = context.query;

  if (typeof lessonId !== "string") {
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
  let topic: Topic | null = null;
  try {
    const response = await ssg.lessons.getById.fetch(lessonId);
    topic = response.topic;
  } catch (e) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  // Fetch data before first page load
  await ssg.countries.getByTopic.prefetch(topic.id);
  await ssg.documents.getByTopic.prefetch(topic.id);

  return {
    props: {
      trpcState: ssg.dehydrate(),
      lessonId,
      topicId: topic.id,
    },
  };
}

export default function Lessons({
  lessonId,
  topicId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: session, status } = useSession();
  const [position, setPosition] = useState<Position>("NEUTRAL");
  // Client side memoized check.
  // TODO: Abstract away as UserAllowed Component
  const isAuthorized = useMemo(() => {
    const user = session?.user;
    if (!user) return false;
    return checkRoles(user.role, ["SECRETARY_GENERAL", "TEACHER"]);
  }, [session]);
  const { toast } = useToast();
  const { data: lessonQueryData, isLoading: lessonIsLoading } =
    api.lessons.getById.useQuery(lessonId);
  const { data: countries, isLoading: countriesIsLoading } =
    api.countries.getByTopic.useQuery(topicId);
  const { data: userCountry, isLoading: userCountryIsLoading } =
    api.countries.getUserCountry.useQuery(topicId);
  const addMemberMutation = api.countries.addStudent.useMutation({
    onSuccess(country) {
      const { name } = country;
      toast({
        title: `Joined ${name}`,
        description: `Successfully joined ${name}`,
      });
    },
    async onSettled() {
      await utils.countries.getUserCountry.invalidate();
    },
  });
  const removeMemberMutation = api.countries.removeStudent.useMutation({
    onSuccess(country) {
      const { name } = country;
      toast({
        title: `Left ${name}`,
        description: `Successfully left ${name}`,
      });
    },
    async onSettled() {
      await utils.countries.getUserCountry.invalidate();
    },
  });
  const { data: documents, isLoading: documentsIsLoading } =
    api.documents.getByTopic.useQuery(topicId);
  const utils = api.useContext();
  // TODO: Somehow get the flag?
  const countryRef = useRef<HTMLInputElement>(null);
  const documentNameRef = useRef<HTMLInputElement>(null);
  const documentURIRef = useRef<HTMLInputElement>(null);
  const newCountryMutator = api.countries.create.useMutation({
    onError() {
      toast({
        title: "Error occurred",
        description: "Country already exists under this topic",
        variant: "destructive",
      });
    },
    async onSettled() {
      await utils.countries.invalidate();
      if (!countryRef || !countryRef.current || !countryRef.current.value)
        return;
      countryRef.current.value = "";
    },
  });
  const countryDeleter = api.countries.delete.useMutation({
    onError() {
      toast({
        title: "Error occurred",
        description: "Unknown error",
        variant: "destructive",
      });
    },
    async onSuccess(country) {
      await utils.countries.invalidate();
      toast({
        title: `Successfully deleted ${country.name}`,
        description: "Deleted the country from the topic",
      });
    },
  });
  const userRelatedDocuments = useMemo(() => {
    if (
      documents == undefined ||
      documents.length == 0 ||
      userCountry == undefined
    )
      return [];
    // filter all documents to just include
    // the ones with countryId equal to the
    // country id of the users country
    return documents.filter((document) => {
      return document.countryId === userCountry.id;
    });
  }, [documents, userCountry]);
  const documentCreator = api.documents.create.useMutation({
    async onSuccess(doc) {
      toast({
        title: `Created new document ${doc.name}`,
      });
      if (
        documentNameRef == undefined ||
        documentNameRef.current == undefined ||
        documentURIRef == undefined ||
        documentURIRef.current == undefined
      )
        return;
      documentNameRef.current.value = "";
      documentURIRef.current.value = "";
      await utils.documents.invalidate();
    },
    onError() {
      toast({
        title: "Could not create document",
        variant: "destructive",
      });
    },
  });
  const documentDeleter = api.documents.deleteById.useMutation({
    async onSuccess(doc) {
      toast({
        title: `Deleted document "${doc.name}"`,
      });
      await utils.documents.invalidate();
    },
    onError() {
      toast({
        title: "Could not delete the document",
        variant: "destructive",
      });
    },
  });

  function handleNewCountry(e: FormEvent) {
    e.preventDefault();
    if (!countryRef || !countryRef.current || !countryRef.current.value) return;
    const countryName = countryRef.current.value;
    if (!countryName) return;

    // cuid parser
    const cuidParser = z.string().cuid();

    // parse user
    const topicId = cuidParser.parse(lessonQueryData?.topic.id);

    newCountryMutator.mutate({
      name: countryName,
      position: position,
      studentIds: [],
      topicId,
    });
  }

  function handleDelete(id: string) {
    return () => {
      countryDeleter.mutate(id);
    };
  }

  function handleJoinCountry(id: string) {
    return () => {
      addMemberMutation.mutate(id);
    };
  }
  function handleLeaveCountry(id: string) {
    return () => {
      removeMemberMutation.mutate(id);
    };
  }

  function handleNewDocument(e: FormEvent) {
    e.preventDefault();
    // still loading page
    if (
      documentNameRef == undefined ||
      documentNameRef.current == undefined ||
      documentURIRef == undefined ||
      documentURIRef.current == undefined ||
      userCountry == undefined
    )
      return;
    const name = documentNameRef.current.value;
    const uri = documentURIRef.current.value;

    documentCreator.mutate({
      countryId: userCountry.id,
      topicId,
      name,
      uri,
    });
  }

  function deleteDocument(documentId: string) {
    return () => {
      documentDeleter.mutate(documentId);
    };
  }

  if (
    lessonIsLoading ||
    countriesIsLoading ||
    documentsIsLoading ||
    userCountryIsLoading ||
    status === "loading" ||
    !lessonQueryData ||
    !countries ||
    !documents ||
    !session
  )
    return <Loading />;

  return (
    <UserAllowed allowed={["STUDENT", "SECRETARY_GENERAL", "TEACHER"]}>
      <div className="flex flex-row justify-around">
        <div className="flex flex-col">
          <TypographyH1 title="About the lesson" />
          {session.user.role === "SECRETARY_GENERAL" ||
            (session.user.role === "TEACHER" && (
              <Link
                className="flex flex-row"
                href={`/dashboard/edit/lesson/${lessonId}`}
              >
                <Button variant="link">
                  Edit the lesson
                  <Edit className="mx-2 h-4 w-4" />
                </Button>
              </Link>
            ))}
          {session.user.role === "TEACHER" && (
            <Link
              className="flex flex-row"
              href={`/dashboard/attendance/${lessonId}`}
            >
              <Button variant="link">
                Take attendance
                <UsersIcon className="mx-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          <TypographyH2 title={lessonQueryData.lesson?.location || ""} />
          <TypographyP
            text={lessonQueryData.lesson?.timestamp.toDateString() || ""}
          />
          <TypographyP
            text={
              userCountry == undefined
                ? `You are not a delegate of a country`
                : `You are a delegate of ${userCountry.name.toUpperCase()}`
            }
          />

          {userCountry !== null && (
            <TypographyTable
              titles={[<>Documents</>, <>Delete</>]}
              rows={
                userRelatedDocuments.length > 0
                  ? userRelatedDocuments.map(
                      (document: Document, i: number) => {
                        return [
                          <Link
                            className="flex flex-row"
                            key={i}
                            href={document.uri}
                            target="_blank"
                          >
                            <Button variant="link">
                              {document.name}
                              <ExternalLink className="mx-2 h-4 w-4" />
                            </Button>
                          </Link>,
                          <Button
                            className="flex flex-row"
                            key={i + 1}
                            variant="destructive"
                            onClick={deleteDocument(document.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>,
                        ];
                      }
                    )
                  : [[<>No documents found for your country</>, <></>]]
              }
            />
          )}

          {userCountry !== null && (
            <form onSubmit={handleNewDocument}>
              <Label htmlFor="document-name">Name of the document</Label>
              <Input
                id="document-name"
                ref={documentNameRef}
                type="text"
                placeholder="Name of the document"
                required={true}
              />
              <Label htmlFor="link">Link to the document</Label>
              <Input
                id="link"
                ref={documentURIRef}
                type="text"
                placeholder="Link to the document"
                required={true}
              />
              <Button variant="subtle" type="submit">
                Add a new document
                <Plus className="mx-2 h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
        <div>
          <TypographyH1 title="About the topic" />
          {isAuthorized && (
            <Link href={`/dashboard/edit/topic/${lessonQueryData.topic.id}`}>
              <Button variant="link">
                Edit the topic <Edit className="mx-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          <TypographyH2 title={lessonQueryData.topic?.title || ""} />
          <TypographyP
            text={lessonQueryData.topic?.description || "No description"}
          />
          <TypographyH2 title="Countries" />

          {/* List of all participating countries */}
          <TypographyTable
            titles={[<>Countries</>]}
            rows={
              countries.length > 0
                ? countries.map((country: Country) => {
                    const isInSomeCountry = userCountry != undefined;
                    // find docs that belong to country
                    const countryDocs = documents.filter(
                      (doc: Document) => doc.countryId === country.id
                    ).length;
                    const userInThisCountry =
                      isInSomeCountry && country.id === userCountry.id;
                    return [
                      <div key={`${country.position}-${country.name}`}>
                        {country.name}
                        {!isInSomeCountry && (
                          <Button
                            variant="outline"
                            onClick={handleJoinCountry(country.id)}
                          >
                            Join
                          </Button>
                        )}
                        {userInThisCountry && (
                          <Button
                            variant="outline"
                            onClick={handleLeaveCountry(country.id)}
                          >
                            Leave
                          </Button>
                        )}
                        {isAuthorized && (
                          <Button
                            variant="destructive"
                            onClick={handleDelete(country.id)}
                          >
                            DELETE
                          </Button>
                        )}
                        {`Has ${countryDocs} documents`}
                      </div>,
                    ];
                  })
                : [[<>No countries in this lesson</>]]
            }
          />

          {isAuthorized && (
            <form onSubmit={handleNewCountry}>
              <Input
                ref={countryRef}
                type="text"
                placeholder="Name of the country"
                required={true}
              />
              <RadioGroup
                defaultValue={position}
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  const position = target.value as Position;
                  setPosition(position);
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="for" value="FOR" />
                  <Label htmlFor="for">For</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="neutral" value="NEUTRAL" />
                  <Label htmlFor="neutral">Neutral</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="against" value="AGAINST" />
                  <Label htmlFor="against">Against</Label>
                </div>
              </RadioGroup>
              <Button variant="subtle" type="submit">
                Add a new country
                <Plus className="mx-2 h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </UserAllowed>
  );
}
