import { createClient } from "@/lib/supabase/server";
import CalendarView from "@/components/CalendarView";

export const metadata = { title: "Calendar" };

export default async function ClientCalendarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: cases } = await supabase
    .from("cases")
    .select("id,title,status,next_hearing_date")
    .eq("client_id", user!.id)
    .order("next_hearing_date", { ascending: true });

  const events = (cases ?? [])
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
