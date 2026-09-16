import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteApiResponse } from "@/lib/api/endpoints/sub-actions";

export function ApiResponseActions({
  endpointId,
  responseId,
}: {
  endpointId: string;
  responseId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", responseId);
    fd.set("endpointId", endpointId);
    return deleteApiResponse(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="response"
      size="sm"
    />
  );
}
