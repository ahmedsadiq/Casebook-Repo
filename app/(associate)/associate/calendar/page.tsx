import { createClient } from "@/lib/supabase/server";
import CalendarView from "@/components/CalendarView";

export const metadata = { title: "Calendar" };

export default async function AssociateCalendarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: assigned } = await supabase
    .from("case_associates")
    .select("case_id")
    .eq("associate_id", user!.id);

  const caseIds = (assigned ?? []).map(a => a.case_id);

  const { data: cases } = caseIds.length
    ? await supabase
        .from("case_with_alerts")
        .select("id,title,status,next_hearing_date,needs_date_update")
        .in("id", caseIds)
        .order("next_hearing_date", { ascending: true })
    : { data: [] };

  const events = (cases ?? [])
    .filter(c => c.status !== "Disposed of" && c.next_hearing_date)
    .map(c => ({
      date: c.next_hearing_date as string,
      title: c.title,
      caseId: c.id,
      overdue: Boolean((c as { needs_date_update?: boolean }).needs_date_update),
    }));

  return (
    <div className="pg-wrap">
      <CalendarView events={events} basePath="/associate/cases" title="Calendar" />
    </div>
  );
}
