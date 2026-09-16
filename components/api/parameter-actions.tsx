import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteApiParameter } from "@/lib/api/endpoints/sub-actions";

export function ApiParameterActions({
  endpointId,
  parameterId,
}: {
  endpointId: string;
  parameterId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", parameterId);
    fd.set("endpointId", endpointId);
    return deleteApiParameter(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="parameter"
      size="sm"
    />
  );
}
