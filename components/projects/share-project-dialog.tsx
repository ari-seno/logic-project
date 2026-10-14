"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Copy, Link2, RefreshCw, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  disableProjectShareAction,
  enableProjectShareAction,
  rotateProjectShareAction,
} from "@/lib/projects/share-actions";

export function ShareProjectDialog({
  projectId,
  shareEnabled,
  shareToken,
}: {
  projectId: string;
  shareEnabled: boolean;
  shareToken: string | null;
}) {
  const [enabled, setEnabled] = useState(shareEnabled);
  const [token, setToken] = useState(shareToken);
  const [pending, startTransition] = useTransition();

  const shareUrl =
    token && typeof window !== "undefined"
      ? `${window.location.origin}/share/${token}`
      : token
        ? `/share/${token}`
        : "";

  function createLink() {
    startTransition(async () => {
      const result = await enableProjectShareAction(projectId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEnabled(result.state.enabled);
      setToken(result.state.token);
      toast.success("Share link enabled.");
    });
  }

  function stopSharing() {
    startTransition(async () => {
      const result = await disableProjectShareAction(projectId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEnabled(result.state.enabled);
      toast.success("Sharing disabled. Existing links no longer work.");
    });
  }

  function rotateLink() {
    startTransition(async () => {
      const result = await rotateProjectShareAction(projectId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEnabled(result.state.enabled);
      setToken(result.state.token);
      toast.success("New link generated. The old link no longer works.");
    });
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied.");
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
          Share
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-3)] focus:outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Share project
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[var(--muted-foreground)]">
                Anyone with the link can view this project read-only. No account
                is required.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-5">
            {enabled && token ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    aria-label="Share link"
                    className="w-full rounded-lg border border-[var(--input)] bg-[var(--surface-1)] px-3 py-2 font-mono text-xs text-[var(--foreground)]"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={copyLink}
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Copy
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={rotateLink}
                    disabled={pending}
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    {pending ? "Working…" : "Rotate link"}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={stopSharing}
                    disabled={pending}
                  >
                    Stop sharing
                  </Button>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Rotating replaces the token, so previously shared links stop
                  working.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Sharing is off. Create a link to let others view this project.
                </p>
                <div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={createLink}
                    disabled={pending}
                  >
                    <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {pending ? "Working…" : "Create share link"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
