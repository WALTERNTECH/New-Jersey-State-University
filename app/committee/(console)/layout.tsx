import Shell from "@/components/committee/Shell";
import { canDecide, isOwner, requireStaffPage, roleLabels } from "@/lib/staff";
import { statusCounts } from "@/lib/committee";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  // Pages check access themselves too; the layout only needs to know who is here to draw the menu.
  // No Suspense boundary here on purpose: a page's access redirect must happen before anything is sent.
  const me = await requireStaffPage({ allowMustChange: true });
  const counts = await statusCounts(me.id);
  return (
    <Shell name={me.name} roleLabel={roleLabels[me.role]} owner={isOwner(me)} decide={canDecide(me)} counts={counts as unknown as Record<string, number>}>
      {children}
    </Shell>
  );
}
