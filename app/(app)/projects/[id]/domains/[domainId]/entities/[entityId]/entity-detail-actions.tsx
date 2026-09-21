import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteEntity } from "@/lib/entities/actions";

export function EntityDetailActions({
  projectId: _projectId,
  domainId,
  entityId,
  entityName,
}: {
  projectId: string;
  domainId: string;
  entityId: string;
  entityName: string;
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
    <DeleteEntityButton
      action={handleDelete}
      entityLabel={entityName}
      description="This removes the entity and its attributes. Relationships that reference it will also be removed."
      size="sm"
    />
  );
}
