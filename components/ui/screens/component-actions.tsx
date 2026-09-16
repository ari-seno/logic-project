import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteUiComponent } from "@/lib/ui/components/actions";

export function UiComponentActions({
  componentId,
  projectId,
}: {
  componentId: string;
  projectId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", componentId);
    fd.set("projectId", projectId);
    return deleteUiComponent(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="component"
      size="sm"
    />
  );
}
