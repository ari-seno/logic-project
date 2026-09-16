import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteRelationship } from "@/lib/relationships/actions";

export function RelationshipDetailActions({
  projectId,
  relId,
}: {
  projectId: string;
  relId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", relId);
    fd.set("projectId", projectId);
    return deleteRelationship(fd);
  }

  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="relationship"
      size="sm"
    />
  );
}
