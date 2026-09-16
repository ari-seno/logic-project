import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteEntity } from "@/lib/entities/actions";

export function EntityDetailActions({
  projectId: _projectId,
  domainId,
  entityId,
}: {
  projectId: string;
  domainId: string;
  entityId: string;
}) {
  void _projectId;
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", entityId);
    fd.set("domainId", domainId);
    return deleteEntity(fd);
  }

  return (
    <DeleteEntityButton action={handleDelete} entityLabel="entity" size="sm" />
  );
}
