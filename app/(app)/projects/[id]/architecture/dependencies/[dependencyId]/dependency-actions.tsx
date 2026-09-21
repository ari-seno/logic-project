import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteArchitectureComponentDependency } from "@/lib/architecture/dependencies/actions";

export function ArchitectureComponentDependencyActions({
  projectId,
  dependencyId,
}: {
  projectId: string;
  dependencyId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", dependencyId);
    fd.set("projectId", projectId);
    return deleteArchitectureComponentDependency(fd);
  }

  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="this dependency"
      description="This permanently removes the dependency edge between two architecture components."
      size="sm"
    />
  );
}
