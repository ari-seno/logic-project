import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import {
  deleteUiFormField,
  deleteUiState,
  deleteUiInteraction,
} from "@/lib/ui/forms/sub-actions";
import { removeScreenComponent } from "@/lib/ui/screen-components/actions";
import { deleteUiForm } from "@/lib/ui/forms/sub-actions";

export function UiFormActions({
  formId,
  projectId,
}: {
  formId: string;
  projectId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", formId);
    fd.set("projectId", projectId);
    return deleteUiForm(fd);
  }
  return (
    <DeleteEntityButton action={handleDelete} entityLabel="form" size="sm" />
  );
}

export function UiFormFieldActions({
  fieldId,
  projectId,
}: {
  fieldId: string;
  projectId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", fieldId);
    fd.set("projectId", projectId);
    return deleteUiFormField(fd);
  }
  return (
    <DeleteEntityButton action={handleDelete} entityLabel="field" size="sm" />
  );
}

export function UiStateActions({
  stateId,
  projectId,
}: {
  stateId: string;
  projectId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", stateId);
    fd.set("projectId", projectId);
    return deleteUiState(fd);
  }
  return (
    <DeleteEntityButton action={handleDelete} entityLabel="state" size="sm" />
  );
}

export function UiInteractionActions({
  interactionId,
  projectId,
}: {
  interactionId: string;
  projectId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", interactionId);
    fd.set("projectId", projectId);
    return deleteUiInteraction(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="interaction"
      size="sm"
    />
  );
}

export function ScreenComponentActions({
  placementId,
  screenId,
  projectId,
}: {
  placementId: string;
  screenId: string;
  projectId: string;
}) {
  async function handleDelete() {
    "use server";
    const fd = new FormData();
    fd.set("id", placementId);
    fd.set("screenId", screenId);
    fd.set("projectId", projectId);
    return removeScreenComponent(fd);
  }
  return (
    <DeleteEntityButton
      action={handleDelete}
      entityLabel="placement"
      size="sm"
    />
  );
}
