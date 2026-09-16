import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import {
  deleteApiGroup,
} from "@/lib/api/groups/actions";

export function ApiGroupActions({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", groupId);
    fd.set("projectId", projectId);
    return deleteApiGroup(fd);
  }
  return (
    <DeleteEntityButton action={handleDelete} entityLabel="group" size="sm" />
  );
}
