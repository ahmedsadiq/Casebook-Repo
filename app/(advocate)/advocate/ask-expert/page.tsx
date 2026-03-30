import AskExpertChat from "./AskExpertChat";

export const metadata = { title: "Ask an Expert" };

export default function AskExpertPage({
  searchParams,
}: {
  searchParams?: {
    caseId?: string;
    title?: string;
    status?: string;
    court?: string;
    nextHearingDate?: string;
  };
}) {
  const caseContext =
    searchParams?.caseId && searchParams?.title
      ? {
          caseId: searchParams.caseId,
          title: searchParams.title,
          status: searchParams.status,
          court: searchParams.court,
          nextHearingDate: searchParams.nextHearingDate,
        }
      : null;

  return (
    <div className="pg-wrap">
      <div className="mb-6">
        <h1 className="pg-title">Ask an Expert</h1>
        <p className="pg-sub">Chat with Claude for case support, drafting help, and workflow guidance</p>
      </div>
      <AskExpertChat caseContext={caseContext} />
    </div>
  );
}
