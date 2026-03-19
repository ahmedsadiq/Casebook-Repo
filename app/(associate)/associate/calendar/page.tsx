import { createClient } from "@/lib/supabase/server";
import CalendarView from "@/components/CalendarView";
import { isDateUpdateRequired, normalizeCaseStatus } from "@/lib/utils";

export const metadata = { title: "Calendar" };

export default async function AssociateCalendarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: assigned } = await supabase
    .from("case_associates")
    .select("case_id")
    .eq("associate_id", user!.id);

  const caseIds = (assigned ?? []).map(a => a.case_id);

  const { data: rawCases } = caseIds.length
    ? await supabase
        .from("cases")
        .select("*")
        .in("id", caseIds)
        .order("next_hearing_date", { ascending: true })
    : { data: [] };

  const events = (rawCases ?? [])
    .map(c => ({
      ...c,
      status: normalizeCaseStatus(c.status),
      needs_date_update: isDateUpdateRequired(c.next_hearing_date),
    }))
    .filter(c => c.status !== "Disposed of" && c.next_hearing_date)
    .map(c => ({
      date: c.next_hearing_date as string,
      title: c.title,
      caseId: c.id,
      overdue: c.needs_date_update,
    }));

  return (
    <div className="pg-wrap">
      <CalendarView events={events} basePath="/associate/cases" title="Calendar" />
    </div>
  );
}
