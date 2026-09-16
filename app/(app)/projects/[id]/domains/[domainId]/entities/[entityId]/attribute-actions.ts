"use server";

import { deleteAttribute, moveAttribute } from "@/lib/attributes/actions";

export async function handleAttributeMove(formData: FormData) {
  return moveAttribute(formData);
}

export async function handleAttributeDelete(formData: FormData) {
  return deleteAttribute(formData);
}
