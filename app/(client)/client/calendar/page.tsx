import { createClient } from "@/lib/supabase/server";
import CalendarView from "@/components/CalendarView";
import { normalizeCaseStatus } from "@/lib/utils";

export const metadata = { title: "Calendar" };

export default async function ClientCalendarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawCases } = await supabase
    .from("cases")
    .select("*")
    .eq("client_id", user!.id)
    .order("next_hearing_date", { ascending: true });

  const events = (rawCases ?? [])
    .map(c => ({
      ...c,
      status: normalizeCaseStatus(c.status),
    }))
    .filter(c => c.status !== "Disposed of" && c.next_hearing_date)
    .map(c => ({
      date: c.next_hearing_date as string,
      title: c.title,
      caseId: c.id,
    }));

  return (
    <div className="pg-wrap">
      <CalendarView events={events} basePath="/client/cases" title="Calendar" />
    </div>
  );
}
