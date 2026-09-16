import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteApiError } from "@/lib/api/endpoints/sub-actions";

export function ApiErrorActions({
  endpointId,
  errorId,
}: {
  endpointId: string;
  errorId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", errorId);
    fd.set("endpointId", endpointId);
    return deleteApiError(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="error"
      size="sm"
    />
  );
}
