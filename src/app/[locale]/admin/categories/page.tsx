'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  ArrowLeft,
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  _id: string;
  name: string;
  type: 'subject' | 'topic' | 'subtopic';
  parentId?: string;
  children?: Category[];
}

export default function CategoriesPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [parentForNew, setParentForNew] = useState<string | undefined>();
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetch('/api/categories')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCategories(data.categories ?? data ?? []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAdd = (parentId?: string) => {
    setEditItem(null);
    setParentForNew(parentId);
    setNewName('');
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditItem(cat);
    setParentForNew(cat.parentId);
    setNewName(cat.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!newName.trim()) return;
    try {
      if (editItem) {
        await fetch(`/api/categories/${editItem._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
        });
      } else {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, parentId: parentForNew }),
        });
      }
      // Refresh
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories ?? data ?? []);
      }
    } catch {
      /* handle error */
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories ?? data ?? []);
      }
    } catch {
      /* handle error */
    }
  };

  const renderTree = (items: Category[], depth = 0) => (
    <ul className={depth > 0 ? 'ms-6 border-s border-border ps-4' : ''}>
      {items.map((cat) => {
        const isExpanded = expanded.has(cat._id);
        const hasChildren = cat.children && cat.children.length > 0;

        return (
          <li key={cat._id} className="py-1.5">
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-muted/50">
              {hasChildren ? (
                <button
                  className="cursor-pointer p-0.5"
                  onClick={() => toggleExpand(cat._id)}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
                  )}
                </button>
              ) : (
                <span className="w-5" />
              )}

              <span className="flex-1 text-sm font-medium text-foreground">{cat.name}</span>

              <span className="text-xs text-muted-foreground capitalize">{cat.type}</span>

              <Button
                variant="ghost"
                size="icon-xs"
                className="cursor-pointer"
                onClick={() => openAdd(cat._id)}
                aria-label="Add child"
              >
                <Plus className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="cursor-pointer"
                onClick={() => openEdit(cat)}
                aria-label="Edit"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="cursor-pointer text-destructive hover:text-destructive"
                onClick={() => handleDelete(cat._id)}
                aria-label="Delete"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            {hasChildren && isExpanded && renderTree(cat.children!, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('title')}
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/10">
            <FolderTree className="size-5 text-secondary" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Category Manager
          </h1>
        </div>
        <Button className="cursor-pointer gap-2 rounded-xl" onClick={() => openAdd()}>
          <Plus className="size-4" />
          Add Subject
        </Button>
      </div>

      <Card className="rounded-xl border border-border p-6 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <FolderTree className="mb-3 size-12 text-muted-foreground/40" />
              <p className="text-lg font-medium text-foreground">No categories yet</p>
              <p className="text-sm text-muted-foreground">
                Start by adding a subject.
              </p>
            </div>
          ) : (
            renderTree(categories)
          )}
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">
              {editItem ? 'Rename Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setDialogOpen(false)}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                className="cursor-pointer"
                disabled={!newName.trim()}
                onClick={handleSave}
              >
                {tCommon('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
