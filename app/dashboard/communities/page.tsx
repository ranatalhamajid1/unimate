import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import { CommunitiesView } from "@/components/communities/communities-view";

export const metadata = {
  title: "Campus Network & Communities | UniMate",
  description: "Discover study groups, academic societies, and student networks in your institution.",
};

export default async function CommunitiesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      university: { select: { name: true, shortName: true } },
      campus: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  return (
    <CommunitiesView
      userUniversityName={user?.university?.shortName || user?.university?.name || null}
      userCampusName={user?.campus?.name || null}
      userDepartmentName={user?.department?.name || null}
    />
  );
}
