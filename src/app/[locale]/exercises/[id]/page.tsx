'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Heart,
  MessageCircle,
  Lightbulb,
  PlusCircle,
  Image as ImageIcon,
  FileText,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { RoleBadge } from '@/components/ui/role-badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { SubmitSolutionDialog } from '@/components/exercises/submit-solution-dialog';
import { HintModal } from '@/components/exercises/hint-modal';
import { SimilarExercisesSidebar } from '@/components/exercises/similar-exercises-sidebar';
import { CommentsThread } from '@/components/exercises/comments-thread';
import { PdfPreview } from '@/components/exercises/pdf-preview';
import { ImageLightbox } from '@/components/exercises/image-lightbox';
import { MathText } from '@/components/ui/math-text';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Author {
  _id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  isVerifiedTeacher?: boolean;
  avatar?: string | null;
}

interface Exercise {
  _id: string;
  title: string;
  description: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  author?: Author;
  attachments?: string[];
  createdAt?: string;
  hasMath?: boolean;
  figureDescriptions?: string[];
}

interface Solution {
  _id: string;
  content: string;
  author?: Author;
  images?: string[];
  likes?: string[];
  likesCount?: number;
  commentCount?: number;
  createdAt?: string;
}

export default function ExerciseDetailPage() {
  const t = useTranslations('exercises.detail');
  const tSol = useTranslations('solutions');
  const tAi = useTranslations('ai');
  const tCommon = useTranslations('common');
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user: authUser } = useAuth();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [commentsOpenFor, setCommentsOpenFor] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [deleteExerciseOpen, setDeleteExerciseOpen] = useState(false);
  const [deleteSolutionId, setDeleteSolutionId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isExerciseAuthor = authUser && exercise?.author?._id === authUser._id;

  const handleDeleteExercise = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/exercises/${id}`, { method: 'DELETE' });
      if (res.ok) router.push('/exercises');
    } catch { /* */ } finally {
      setDeleting(false);
      setDeleteExerciseOpen(false);
    }
  };

  const handleDeleteSolution = async () => {
    if (!deleteSolutionId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/solutions/${deleteSolutionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSolutions((prev) => prev.filter((s) => s._id !== deleteSolutionId));
      }
    } catch { /* */ } finally {
      setDeleting(false);
      setDeleteSolutionId(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [exRes, solRes] = await Promise.all([
          fetch(`/api/exercises/${id}`),
          fetch(`/api/exercises/${id}/solutions`),
        ]);
        if (exRes.ok) setExercise(await exRes.json());
        if (solRes.ok) {
          const data = await solRes.json();
          setSolutions(data.data ?? []);
        }
      } catch {
        /* API not available yet */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-2 h-6 w-full max-w-xl" />
        <Skeleton className="h-40 w-full max-w-xl" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back nav */}
      <Link
        href="/exercises"
        className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('solutions')}
      </Link>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main content */}
        <div className="flex-1 space-y-8">
          {/* Exercise card */}
          <Card className="rounded-xl border border-border p-6 shadow-sm">
            <CardContent className="space-y-5 p-0">
              <div className="flex flex-wrap items-start gap-3">
                <h1 className="flex-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {exercise?.title ?? 'Exercise'}
                </h1>
                {exercise?.difficulty && (
                  <DifficultyBadge level={exercise.difficulty} />
                )}
              </div>

              {(exercise?.subject || exercise?.topic) && (
                <div className="flex flex-wrap gap-2">
                  {exercise.subject && (
                    <Badge variant="secondary" className="text-xs">{exercise.subject}</Badge>
                  )}
                  {exercise.topic && (
                    <Badge variant="outline" className="text-xs">{exercise.topic}</Badge>
                  )}
                  {exercise.subtopic && (
                    <Badge variant="outline" className="text-xs">{exercise.subtopic}</Badge>
                  )}
                </div>
              )}

              {exercise?.hasMath ? (
                <MathText className="text-base leading-relaxed text-foreground/90">
                  {exercise.description}
                </MathText>
              ) : (
                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
                  {exercise?.description ?? ''}
                </p>
              )}

              {exercise?.figureDescriptions && exercise.figureDescriptions.length > 0 && (
                <ul className="space-y-2 border-s-2 border-border ps-4">
                  {exercise.figureDescriptions.map((d, i) => (
                    <li key={i} className="text-sm italic leading-relaxed text-muted-foreground">
                      {d}
                    </li>
                  ))}
                </ul>
              )}

              {/* Attachments */}
              {exercise?.attachments && exercise.attachments.length > 0 && (
                <div className="space-y-3">
                  {exercise.attachments.map((url, i) => {
                    const isPdf = url.toLowerCase().endsWith('.pdf') || url.includes('/raw/');
                    if (isPdf) {
                      return <PdfPreview key={i} url={url} />;
                    }
                    return (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm transition-colors duration-200 hover:bg-muted"
                      >
                        <ImageIcon className="size-4 text-primary" />
                        {url.split('/').pop() || `image-${i + 1}`}
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {exercise?.author && (
                  <span className="flex items-center gap-1.5">
                    <UserAvatar src={exercise.author.avatar} name={exercise.author.name} size="sm" />
                    <span>{exercise.author.name}</span>
                    {exercise.author.role && (
                      <RoleBadge
                        role={exercise.author.role}
                        isVerified={exercise.author.isVerifiedTeacher}
                      />
                    )}
                  </span>
                )}
                {exercise?.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    {new Date(exercise.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  className="cursor-pointer gap-2 rounded-xl"
                  onClick={() => setSubmitOpen(true)}
                >
                  <PlusCircle className="size-4" />
                  {tSol('submit')}
                </Button>
                <Button
                  variant="outline"
                  className="cursor-pointer gap-2 rounded-xl"
                  onClick={() => setHintOpen(true)}
                >
                  <Lightbulb className="size-4" />
                  {tAi('hintButton')}
                </Button>
                {isExerciseAuthor && (
                  <Button
                    variant="ghost"
                    className="cursor-pointer gap-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteExerciseOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    {tCommon('delete')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Solutions list */}
          <section>
            <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
              {t('solutions')} ({solutions.length})
            </h2>

            {solutions.length === 0 ? (
              <Card className="flex flex-col items-center rounded-xl border border-border p-8 text-center shadow-sm">
                <MessageCircle className="mb-3 size-10 text-muted-foreground/40" />
                <p className="font-medium text-foreground">{t('noSolutions')}</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {solutions.map((sol) => (
                  <Card key={sol._id} className="rounded-xl border border-border p-6 shadow-sm">
                    <CardContent className="space-y-4 p-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={sol.author?.avatar} name={sol.author?.name} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {sol.author?.name ?? 'Anonymous'}
                            </p>
                            <div className="flex items-center gap-2">
                              {sol.author?.role && (
                                <RoleBadge
                                  role={sol.author.role}
                                  isVerified={sol.author.isVerifiedTeacher}
                                />
                              )}
                              {sol.createdAt && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(sol.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {authUser && sol.author?._id === authUser._id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 cursor-pointer text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteSolutionId(sol._id)}
                            aria-label="Delete solution"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {sol.content}
                      </p>

                      {sol.images && sol.images.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {sol.images.map((url, i) => (
                            <button
                              key={i}
                              type="button"
                              className="cursor-pointer overflow-hidden rounded-lg border border-border transition-opacity duration-200 hover:opacity-80"
                              onClick={() => setLightbox({ images: sol.images!, index: i })}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Attachment ${i + 1}`}
                                className="h-24 w-auto object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      <Separator />

                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`cursor-pointer gap-1.5 ${sol.likes?.includes(authUser?._id ?? '') ? 'text-destructive' : 'text-muted-foreground'}`}
                          onClick={async () => {
                            if (!authUser) return;
                            try {
                              const res = await fetch(`/api/solutions/${sol._id}/like`, { method: 'POST' });
                              if (res.ok) {
                                const data = await res.json();
                                setSolutions((prev) =>
                                  prev.map((s) =>
                                    s._id === sol._id
                                      ? {
                                          ...s,
                                          likesCount: data.likesCount,
                                          likes: data.liked
                                            ? [...(s.likes ?? []), authUser._id]
                                            : (s.likes ?? []).filter((id) => id !== authUser._id),
                                        }
                                      : s
                                  )
                                );
                              }
                            } catch { /* */ }
                          }}
                        >
                          <Heart className={`size-4 ${sol.likes?.includes(authUser?._id ?? '') ? 'fill-destructive' : ''}`} />
                          <span className="text-xs">{sol.likesCount ?? sol.likes?.length ?? 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer gap-1.5 text-muted-foreground"
                          onClick={() =>
                            setCommentsOpenFor(
                              commentsOpenFor === sol._id ? null : sol._id
                            )
                          }
                        >
                          <MessageCircle className="size-4" />
                          <span className="text-xs">{sol.commentCount ?? 0}</span>
                        </Button>
                      </div>

                      {commentsOpenFor === sol._id && (
                        <CommentsThread solutionId={sol._id} />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Similar Exercises sidebar */}
        <aside className="w-full shrink-0 lg:w-80">
          <SimilarExercisesSidebar exerciseId={id} />
        </aside>
      </div>

      {/* Modals */}
      <SubmitSolutionDialog
        exerciseId={id}
        open={submitOpen}
        onOpenChange={setSubmitOpen}
      />
      <HintModal
        exerciseId={id}
        exerciseTitle={exercise?.title ?? ''}
        open={hintOpen}
        onOpenChange={setHintOpen}
      />
      <ImageLightbox
        images={lightbox?.images ?? []}
        initialIndex={lightbox?.index ?? 0}
        open={lightbox !== null}
        onOpenChange={(open) => { if (!open) setLightbox(null); }}
      />

      {/* Delete exercise confirmation */}
      <Dialog open={deleteExerciseOpen} onOpenChange={setDeleteExerciseOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-destructive">{tCommon('delete')}</DialogTitle>
            <DialogDescription>
              This will permanently delete this exercise and all its solutions and comments.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="cursor-pointer rounded-xl" onClick={() => setDeleteExerciseOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" className="cursor-pointer rounded-xl" onClick={handleDeleteExercise} disabled={deleting}>
              {deleting && <Loader2 className="me-2 size-4 animate-spin" />}
              {tCommon('delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete solution confirmation */}
      <Dialog open={deleteSolutionId !== null} onOpenChange={(open) => { if (!open) setDeleteSolutionId(null); }}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-destructive">{tCommon('delete')}</DialogTitle>
            <DialogDescription>
              This will permanently delete this solution and all its comments.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="cursor-pointer rounded-xl" onClick={() => setDeleteSolutionId(null)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" className="cursor-pointer rounded-xl" onClick={handleDeleteSolution} disabled={deleting}>
              {deleting && <Loader2 className="me-2 size-4 animate-spin" />}
              {tCommon('delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
