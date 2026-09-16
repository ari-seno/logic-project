import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteUiScreen } from "@/lib/ui/screens/actions";

export function UiScreenActions({
  screenId,
  projectId,
}: {
  screenId: string;
  projectId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", screenId);
    fd.set("projectId", projectId);
    return deleteUiScreen(fd);
  }
  return (
    <DeleteEntityButton action={handleDelete} entityLabel="screen" size="sm" />
  );
}
