'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/providers/AuthProvider';

export function DangerZoneSection() {
  const t = useTranslations('settings.dangerZoneSection');
  const { user } = useAuth();

  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const canDelete = confirmEmail.trim().toLowerCase() === (user?.email ?? '').toLowerCase();

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/profile/me', { method: 'DELETE' });
      if (res.ok) {
        // Cookie is cleared server-side; force full reload to /login
        window.location.href = '/login';
      } else {
        const data = await res.json();
        setDeleteError(data.error ?? t('deleteError'));
      }
    } catch {
      setDeleteError(t('deleteError'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#ED2D30]">{t('title')}</h2>

      {/* Export data */}
      <div className="rounded-2xl border border-[#BBC8D4] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-[#25313C]">{t('exportData')}</p>
            <p className="text-sm text-[#6D7D8B]">{t('exportDataDesc')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer flex-shrink-0"
            onClick={() => setShowExportModal(true)}
          >
            {t('exportData')}
          </Button>
        </div>
      </div>

      {/* Delete account */}
      <div className="rounded-2xl border border-[#ED2D30]/40 bg-[#FEEAEA] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-[#ED2D30]">{t('deleteAccount')}</p>
            <p className="text-sm text-[#6D7D8B]">{t('deleteAccountDesc')}</p>
          </div>
          <Button
            intent="primary-red"
            size="sm"
            className="cursor-pointer flex-shrink-0"
            onClick={() => setShowDeleteModal(true)}
          >
            {t('deleteAccount')}
          </Button>
        </div>
      </div>

      {/* Export modal — "coming soon" */}
      {showExportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-bold text-[#003449]">{t('exportData')}</h3>
            <p className="text-sm text-[#6D7D8B]">{t('exportComingSoon')}</p>
            <div className="mt-6 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => setShowExportModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3 text-[#ED2D30]">
              <AlertTriangle className="size-6" />
              <h3 className="text-lg font-bold">{t('deleteConfirmTitle')}</h3>
            </div>
            <p className="mb-4 text-sm text-[#6D7D8B]">{t('deleteConfirmDescription')}</p>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm-email">{t('deleteConfirmPlaceholder')}</Label>
              <Input
                id="delete-confirm-email"
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={user?.email ?? ''}
                className="h-11 rounded-2xl"
                autoComplete="off"
              />
            </div>

            {deleteError && (
              <p className="mt-2 text-sm text-[#ED2D30]">{deleteError}</p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                intent="primary-red"
                size="sm"
                className="cursor-pointer"
                disabled={!canDelete || deleting}
                onClick={handleDelete}
              >
                {deleting ? <Loader2 className="size-3 animate-spin" /> : t('deleteConfirmAction')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
