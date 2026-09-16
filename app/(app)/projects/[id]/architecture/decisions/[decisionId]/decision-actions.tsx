import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteArchitectureDecision } from "@/lib/architecture/decisions/actions";

export function ArchitectureDecisionActions({
  projectId,
  decisionId,
}: {
  projectId: string;
  decisionId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", decisionId);
    fd.set("projectId", projectId);
    return deleteArchitectureDecision(fd);
  }

  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="decision"
      size="sm"
    />
  );
}
