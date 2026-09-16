import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { deleteTask } from "@/lib/tasks/actions";
import { deleteTaskDependency } from "@/lib/tasks/dependencies/actions";
import {
  detachRequirementFromTask,
  detachDecisionFromTask,
  detachEntityFromTask,
  detachComponentFromTask,
  detachEndpointFromTask,
  detachUiScreenFromTask,
} from "@/lib/tasks/traceability/actions";

export function TaskActions({
  taskId,
}: {
  taskId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", taskId);
    return deleteTask(fd);
  }
  return (
    <DeleteEntityButton action={handleDelete} entityLabel="task" size="sm" />
  );
}

export function TaskDependencyActions({
  depId,
  taskId,
}: {
  depId: string;
  taskId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", depId);
    fd.set("taskId", taskId);
    return deleteTaskDependency(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="dependency"
      size="sm"
    />
  );
}

export function DetachRequirementAction({
  linkId,
  taskId,
}: {
  linkId: string;
  taskId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", linkId);
    fd.set("taskId", taskId);
    return detachRequirementFromTask(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="link"
      size="sm"
    />
  );
}

export function DetachDecisionAction({
  linkId,
  taskId,
}: {
  linkId: string;
  taskId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", linkId);
    fd.set("taskId", taskId);
    return detachDecisionFromTask(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="link"
      size="sm"
    />
  );
}

export function DetachEntityAction({
  linkId,
  taskId,
}: {
  linkId: string;
  taskId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", linkId);
    fd.set("taskId", taskId);
    return detachEntityFromTask(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="link"
      size="sm"
    />
  );
}

export function DetachComponentAction({
  linkId,
  taskId,
}: {
  linkId: string;
  taskId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", linkId);
    fd.set("taskId", taskId);
    return detachComponentFromTask(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="link"
      size="sm"
    />
  );
}

export function DetachEndpointAction({
  linkId,
  taskId,
}: {
  linkId: string;
  taskId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", linkId);
    fd.set("taskId", taskId);
    return detachEndpointFromTask(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="link"
      size="sm"
    />
  );
}

export function DetachUiScreenAction({
  linkId,
  taskId,
}: {
  linkId: string;
  taskId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", linkId);
    fd.set("taskId", taskId);
    return detachUiScreenFromTask(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="link"
      size="sm"
    />
  );
}
