import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteApiRequestBody } from "@/lib/api/endpoints/sub-actions";

export function ApiRequestBodyActions({
  endpointId,
}: {
  endpointId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("endpointId", endpointId);
    return deleteApiRequestBody(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="request body"
      size="sm"
    />
  );
}
