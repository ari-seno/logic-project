import { ButtonLink } from "@/components/ui/button";
import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import {
  deleteApiEndpoint,
} from "@/lib/api/endpoints/actions";

export function ApiEndpointActions({
  endpointId,
  projectId,
  editHref,
}: {
  endpointId: string;
  projectId: string;
  editHref: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", endpointId);
    fd.set("projectId", projectId);
    return deleteApiEndpoint(fd);
  }
  return (
    <div className="flex shrink-0 gap-2">
      <ButtonLink href={editHref} variant="secondary" size="sm">
        Edit
      </ButtonLink>
      <DeleteEntityButton
        action={handleDelete}
        entityLabel="endpoint"
        size="sm"
      />
    </div>
  );
}
