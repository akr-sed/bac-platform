'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  User,
  Calendar,
  BookOpen,
  MessageCircle,
  Edit3,
  Award,
  Trash2,
  Settings,
  Camera,
  Loader2,
  Lock,
  Mail,
  Bookmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PointsPill } from '@/components/ui/points-pill';
import { RoleBadge } from '@/components/ui/role-badge';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import { useAuth } from '@/components/providers/AuthProvider';
import { SubjectPicker } from '@/components/profile/subject-picker';
import { ExerciseCard } from '@/components/exercises/exercise-card';
import type { FeedItemDTO } from '@/types';

interface Profile {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  isVerifiedTeacher?: boolean;
  points: number;
  avatar?: string | null;
  badge: string;
  createdAt: string;
  preferences?: { subjects: string[] };
  exercises: Array<{
    _id: string;
    title: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    createdAt?: string;
  }>;
  solutions: Array<{
    _id: string;
    exerciseId?: string | null;
    exerciseTitle?: string;
    createdAt?: string;
  }>;
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const roles = useTranslations('roles');
  const reputation = useTranslations('reputation.badges');

  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsCurrentPw, setSettingsCurrentPw] = useState('');
  const [settingsNewPw, setSettingsNewPw] = useState('');
  const [settingsConfirmPw, setSettingsConfirmPw] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Saved tab
  const [activeTab, setActiveTab] = useState<string>('exercises');
  const [savedItems, setSavedItems] = useState<FeedItemDTO[] | null>(null);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState('');

  // Subject preferences save feedback
  const [prefsError, setPrefsError] = useState('');
  const [prefsSuccess, setPrefsSuccess] = useState('');

  useEffect(() => {
    fetch('/api/profile/me')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        const points = data.user.points ?? 0;
        setProfile({
          ...data.user,
          badge: points >= 100 ? 'expert' : points >= 50 ? 'advanced' : points >= 20 ? 'intermediate' : 'beginner',
          exercises: data.exercises ?? [],
          solutions: data.solutions ?? [],
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  // Lazy-fetch saved exercises when Saved tab becomes active
  useEffect(() => {
    if (activeTab !== 'saved' || savedItems !== null || savedLoading) return;
    setSavedLoading(true);
    setSavedError('');
    fetch('/api/saves')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const json = await res.json();
        const raw = Array.isArray(json.data) ? json.data : [];
        // Adapt Exercise documents (with populated authorId) to FeedItemDTO shape.
        // `/api/saves` populates exerciseId; if the referenced Exercise was
        // deleted (legacy data), the populate yields `null` — skip those.
        const adapted: FeedItemDTO[] = (raw as unknown[])
          .filter(
            (ex): ex is Record<string, unknown> =>
              ex !== null && ex !== undefined && typeof ex === 'object'
          )
          .map((ex: Record<string, unknown>) => {
            const author = (ex.authorId as Record<string, unknown>) ?? {};
            return {
              _id: String(ex._id ?? ''),
              title: String(ex.title ?? ''),
              description: String(ex.description ?? ''),
              difficulty: (ex.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium',
              subject: String(ex.subject ?? ''),
              topic: String(ex.topic ?? ''),
              attachments: Array.isArray(ex.attachments) ? (ex.attachments as string[]) : [],
              likesCount: Number(ex.likesCount ?? 0),
              solutionCount: Number(ex.solutionCount ?? 0),
              commentsCount: Number(ex.commentsCount ?? 0),
              lastActivityAt: ex.lastActivityAt
                ? new Date(ex.lastActivityAt as string).toISOString()
                : new Date().toISOString(),
              author: {
                _id: String(author._id ?? ''),
                name: String(author.name ?? ''),
                avatar: (author.avatar as string | null | undefined) ?? null,
                role: (author.role as 'student' | 'teacher' | 'admin') ?? 'student',
                isVerifiedTeacher: Boolean(author.isVerifiedTeacher),
              },
              isLiked: false,
              isSaved: true,
            };
          });
        setSavedItems(adapted);
      })
      .catch(() => setSavedError('Failed to load saved exercises'))
      .finally(() => setSavedLoading(false));
  }, [activeTab, savedItems, savedLoading]);

  // Save subject preferences
  const savePreferences = async (subjects: string[]) => {
    setPrefsError('');
    setPrefsSuccess('');
    try {
      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: { subjects } }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPrefsError(data.error || 'Failed to save preferences');
        return;
      }
      const data = await res.json();
      setProfile((prev) => (prev ? { ...prev, ...data.user, badge: prev.badge } : prev));
      await refreshUser();
      setPrefsSuccess('Preferences saved');
    } catch {
      setPrefsError('Server error');
    }
  };

  // Open edit dialog with current values
  const openEdit = () => {
    if (!profile) return;
    setEditName(profile.name);
    setEditFiles([]);
    setEditError('');
    setPrefsError('');
    setPrefsSuccess('');
    setEditOpen(true);
  };

  // Save profile edits
  const saveProfile = async () => {
    if (!editName.trim()) return;
    setEditSaving(true);
    setEditError('');

    try {
      let avatar: string | undefined;
      if (editFiles.length > 0) {
        const uploadData = new FormData();
        editFiles.forEach((f) => uploadData.append('files', f));
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          avatar = uploadJson.urls?.[0];
        }
      }

      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), ...(avatar ? { avatar } : {}) }),
      });

      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error || 'Failed to save');
        return;
      }

      const data = await res.json();
      setProfile((prev) => prev ? { ...prev, ...data.user, badge: prev.badge } : prev);
      await refreshUser();
      setEditOpen(false);
    } catch {
      setEditError('Server error');
    } finally {
      setEditSaving(false);
    }
  };

  // Open settings dialog
  const openSettings = () => {
    if (!profile) return;
    setSettingsEmail(profile.email);
    setSettingsCurrentPw('');
    setSettingsNewPw('');
    setSettingsConfirmPw('');
    setSettingsError('');
    setSettingsSuccess('');
    setSettingsOpen(true);
  };

  // Save settings
  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSuccess('');

    // Build payload
    const payload: Record<string, string> = {};
    if (settingsEmail.trim() && settingsEmail.trim() !== profile?.email) {
      payload.email = settingsEmail.trim();
    }
    if (settingsNewPw) {
      if (settingsNewPw !== settingsConfirmPw) {
        setSettingsError('Passwords do not match');
        setSettingsSaving(false);
        return;
      }
      if (!settingsCurrentPw) {
        setSettingsError('Current password is required');
        setSettingsSaving(false);
        return;
      }
      payload.currentPassword = settingsCurrentPw;
      payload.newPassword = settingsNewPw;
    }

    if (Object.keys(payload).length === 0) {
      setSettingsError('No changes to save');
      setSettingsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setSettingsError(data.error || 'Failed to save');
        return;
      }

      const data = await res.json();
      setProfile((prev) => prev ? { ...prev, ...data.user, badge: prev.badge } : prev);
      await refreshUser();
      setSettingsSuccess('Settings updated');
      setSettingsCurrentPw('');
      setSettingsNewPw('');
      setSettingsConfirmPw('');
    } catch {
      setSettingsError('Server error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Delete exercise
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/exercises/${deleteTarget}`, { method: 'DELETE' });
      if (res.ok) {
        setProfile((prev) =>
          prev ? { ...prev, exercises: prev.exercises.filter((e) => e._id !== deleteTarget) } : prev
        );
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-center text-muted-foreground">Could not load profile.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile header */}
      <Card className="mb-8 rounded-xl border border-border shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="size-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <User className="size-8 text-primary" />
                </div>
              )}
              <div className="space-y-2">
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {profile.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <RoleBadge
                    role={profile.role}
                    isVerified={profile.isVerifiedTeacher}
                    label={roles(profile.role)}
                  />
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Award className="size-3" />
                    {reputation(profile.badge as 'beginner' | 'intermediate' | 'advanced' | 'expert')}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {t('joinedAt')} {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PointsPill count={profile.points} />
              <Button variant="outline" className="cursor-pointer gap-2 rounded-xl" onClick={openEdit}>
                <Edit3 className="size-4" />
                {t('editProfile')}
              </Button>
              <Button variant="ghost" size="icon" className="cursor-pointer" onClick={openSettings} aria-label="Settings">
                <Settings className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="exercises" className="cursor-pointer gap-1.5">
            <BookOpen className="size-4" />
            {t('exercises')} ({profile.exercises.length})
          </TabsTrigger>
          <TabsTrigger value="solutions" className="cursor-pointer gap-1.5">
            <MessageCircle className="size-4" />
            {t('solutions')} ({profile.solutions.length})
          </TabsTrigger>
          <TabsTrigger value="saved" className="cursor-pointer gap-1.5">
            <Bookmark className="size-4" />
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exercises">
          {profile.exercises.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.exercises.map((ex) => (
                <Card key={ex._id} className="group relative rounded-xl border border-border p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <Link href={`/exercises/${ex._id}`} className="cursor-pointer">
                    <h3 className="line-clamp-2 font-heading text-base font-semibold text-foreground">
                      {ex.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      {ex.difficulty && <DifficultyBadge level={ex.difficulty} />}
                      {ex.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(ex.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute end-2 top-2 size-8 cursor-pointer text-muted-foreground opacity-0 transition-opacity duration-200 hover:text-destructive group-hover:opacity-100"
                    onClick={() => setDeleteTarget(ex._id)}
                    aria-label="Delete exercise"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center rounded-xl border border-border p-10 text-center shadow-sm">
              <BookOpen className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No exercises posted yet.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="solutions">
          {profile.solutions.length > 0 ? (
            <div className="space-y-3">
              {profile.solutions.map((sol) => (
                <Link
                  key={sol._id}
                  href={sol.exerciseId ? `/exercises/${sol.exerciseId}` : '#'}
                  className="block cursor-pointer"
                >
                  <Card className="rounded-xl border border-border p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
                    <p className="text-sm font-medium text-foreground">
                      {sol.exerciseTitle ?? 'Solution'}
                    </p>
                    {sol.createdAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(sol.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center rounded-xl border border-border p-10 text-center shadow-sm">
              <MessageCircle className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No solutions submitted yet.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saved">
          {savedLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : savedError ? (
            <Card className="flex flex-col items-center rounded-xl border border-border p-10 text-center shadow-sm">
              <Bookmark className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-destructive">{savedError}</p>
            </Card>
          ) : savedItems && savedItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedItems.map((ex) => (
                <ExerciseCard key={ex._id} variant="compact" exercise={ex} />
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center rounded-xl border border-border p-10 text-center shadow-sm">
              <Bookmark className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No saved exercises yet.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-destructive">
              {tCommon('delete')}
            </DialogTitle>
            <DialogDescription>
              This will permanently delete this exercise and all its solutions and comments. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="cursor-pointer rounded-xl" onClick={() => setDeleteTarget(null)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer rounded-xl"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="me-2 size-4 animate-spin" />}
              {tCommon('delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{t('editProfile')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {editError && (
              <div role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {editError}
              </div>
            )}

            {/* Avatar upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="size-4" />
                Avatar
              </Label>
              <FileUploadZone
                accept="image/*"
                multiple={false}
                maxFiles={1}
                onFilesChange={setEditFiles}
                label="Upload a profile photo"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('title')}</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <Button
              className="w-full cursor-pointer rounded-xl"
              onClick={saveProfile}
              disabled={editSaving || !editName.trim()}
            >
              {editSaving && <Loader2 className="me-2 size-4 animate-spin" />}
              {tCommon('save')}
            </Button>

            <Separator />

            {/* Subject preferences */}
            <div className="space-y-3">
              <Label>Subject preferences</Label>
              {prefsError && (
                <div role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {prefsError}
                </div>
              )}
              {prefsSuccess && (
                <div role="status" className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
                  {prefsSuccess}
                </div>
              )}
              <SubjectPicker
                initial={profile.preferences?.subjects ?? []}
                onSave={savePreferences}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {settingsError && (
              <div role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {settingsError}
              </div>
            )}
            {settingsSuccess && (
              <div role="status" className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
                {settingsSuccess}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="settings-email" className="flex items-center gap-2">
                <Mail className="size-4" />
                Email
              </Label>
              <Input
                id="settings-email"
                type="email"
                value={settingsEmail}
                onChange={(e) => setSettingsEmail(e.target.value)}
              />
            </div>

            <Separator />

            {/* Password */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Lock className="size-4" />
                Change password
              </Label>
              <Input
                type="password"
                placeholder="Current password"
                autoComplete="current-password"
                value={settingsCurrentPw}
                onChange={(e) => setSettingsCurrentPw(e.target.value)}
              />
              <Input
                type="password"
                placeholder="New password"
                autoComplete="new-password"
                value={settingsNewPw}
                onChange={(e) => setSettingsNewPw(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                value={settingsConfirmPw}
                onChange={(e) => setSettingsConfirmPw(e.target.value)}
              />
            </div>

            <Button
              className="w-full cursor-pointer rounded-xl"
              onClick={saveSettings}
              disabled={settingsSaving}
            >
              {settingsSaving && <Loader2 className="me-2 size-4 animate-spin" />}
              {tCommon('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
