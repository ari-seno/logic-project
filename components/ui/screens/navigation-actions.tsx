import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteUiNavigationItem } from "@/lib/ui/navigation/actions";

export function UiNavigationItemActions({
  itemId,
  projectId,
}: {
  itemId: string;
  projectId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", itemId);
    fd.set("projectId", projectId);
    return deleteUiNavigationItem(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="navigation item"
      size="sm"
    />
  );
}
