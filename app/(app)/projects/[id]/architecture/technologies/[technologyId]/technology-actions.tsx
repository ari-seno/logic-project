import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteArchitectureTechnology } from "@/lib/architecture/technologies/actions";

export function ArchitectureTechnologyActions({
  projectId,
  technologyId,
}: {
  projectId: string;
  technologyId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", technologyId);
    fd.set("projectId", projectId);
    return deleteArchitectureTechnology(fd);
  }

  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="technology"
      size="sm"
    />
  );
}
