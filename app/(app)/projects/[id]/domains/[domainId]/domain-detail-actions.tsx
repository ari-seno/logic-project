import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteDomain } from "@/lib/domains/actions";

export function DomainDetailActions({
  projectId,
  domainId,
}: {
  projectId: string;
  domainId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", domainId);
    fd.set("projectId", projectId);
    return deleteDomain(fd);
  }

  return (
    <DeleteEntityButton action={handleDelete} entityLabel="domain" size="sm" />
  );
}
