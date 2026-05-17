'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddExerciseDialog } from './add-exercise-dialog';

interface Props {
  collectionId: string;
  initialTitle: string;
  initialDescription: string;
  initialVisibility: 'public' | 'private';
  /** Already-included exercise ids — used to hide duplicates in search picker. */
  alreadyIncludedIds: string[];
}

/**
 * Wave C2 — Owner-only manage bar on /collections/[id].
 *
 * Three actions: rename (title/description/visibility), add exercise (search
 * modal that POSTs to /api/collections/[id]/exercises), and delete collection.
 * All operations refresh the server component after success.
 */
export function CollectionManageBar({
  collectionId,
  initialTitle,
  initialDescription,
  initialVisibility,
  alreadyIncludedIds,
}: Props) {
  const t = useTranslations('collections');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [renameOpen, setRenameOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [visibility, setVisibility] = useState<'public' | 'private'>(initialVisibility);
  const [savingRename, setSavingRename] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || savingRename) return;
    setSavingRename(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || '',
          visibility,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? tCommon('error'));
        return;
      }
      setRenameOpen(false);
      router.refresh();
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setSavingRename(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? tCommon('error'));
        return;
      }
      setDeleteOpen(false);
      router.push('/collections');
      router.refresh();
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          className="gap-2 rounded-xl"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="size-4" />
          {t('addExercise')}
        </Button>
        <Button
          variant="outline"
          className="gap-2 rounded-xl"
          onClick={() => setRenameOpen(true)}
        >
          <Pencil className="size-4" />
          {t('rename')}
        </Button>
        <Button
          variant="ghost"
          className="gap-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" />
          {t('delete')}
        </Button>
      </div>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {t('rename')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onRename} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="rename-title">{t('form.title')}</Label>
              <Input
                id="rename-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rename-description">{t('form.description')}</Label>
              <Textarea
                id="rename-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('visibility.label')}</Label>
              <div className="flex gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="rename-visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="accent-[var(--primary)]"
                  />
                  {t('visibility.public')}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="rename-visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    className="accent-[var(--primary)]"
                  />
                  {t('visibility.private')}
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setRenameOpen(false)}
                disabled={savingRename}
              >
                {t('form.cancel')}
              </Button>
              <Button
                type="submit"
                className="gap-2 rounded-xl"
                disabled={!title.trim() || savingRename}
              >
                {savingRename && <Loader2 className="size-4 animate-spin" />}
                {savingRename ? t('saving') : t('save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add-exercise modal */}
      <AddExerciseDialog
        collectionId={collectionId}
        open={addOpen}
        onOpenChange={setAddOpen}
        alreadyIncludedIds={alreadyIncludedIds}
        onAdded={() => router.refresh()}
      />

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-destructive">
              {t('delete')}
            </DialogTitle>
            <DialogDescription>{t('deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              className="gap-2 rounded-xl"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {tCommon('delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
