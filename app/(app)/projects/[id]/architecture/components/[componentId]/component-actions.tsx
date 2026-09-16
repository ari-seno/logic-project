import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteArchitectureComponent } from "@/lib/architecture/components/actions";

export function ArchitectureComponentActions({
  projectId,
  componentId,
}: {
  projectId: string;
  componentId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", componentId);
    fd.set("projectId", projectId);
    return deleteArchitectureComponent(fd);
  }

  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="component"
      size="sm"
    />
  );
}
