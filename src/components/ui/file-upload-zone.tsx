'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  /**
   * Legacy callback — receives raw File objects.
   * Used when the caller wants to handle uploads themselves
   * (e.g. exercise-creation page that uploads as part of submit).
   */
  onFilesChange?: (files: File[]) => void;
  className?: string;
  label?: string;
  /**
   * Controlled list of already-uploaded URLs. Pass this together with
   * `onChange` to enable the auto-upload mode used by solution submission.
   * When provided, the component uploads each selected file via
   * POST /api/upload, appends returned URLs to `value`, and calls
   * `onChange` with the merged list.
   */
  value?: string[];
  onChange?: (urls: string[]) => void;
  /** Optional translatable counter suffix label (e.g. "images"). */
  counterLabel?: string;
}

export function FileUploadZone({
  accept = 'image/*,application/pdf',
  multiple = true,
  maxFiles = 5,
  onFilesChange,
  className,
  label = 'Drop files here or click to browse',
  value,
  onChange,
  counterLabel,
}: FileUploadZoneProps) {
  // When `value`/`onChange` are provided, this is the URL-controlled
  // (auto-upload) mode. Otherwise we keep the legacy File[] internal mode.
  const isControlled = value !== undefined && onChange !== undefined;

  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentCount = isControlled ? value!.length : files.length;
  const remaining = Math.max(0, maxFiles - currentCount);
  const disabled = uploading || remaining === 0;

  const uploadAndAppend = useCallback(
    async (incoming: File[]) => {
      if (!isControlled) return;
      setError(null);
      setUploading(true);
      try {
        const fd = new FormData();
        incoming.forEach((f) => fd.append('files', f));
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          setError('Upload failed');
          return;
        }
        const data = (await res.json()) as { urls?: string[] };
        const urls = data.urls ?? [];
        onChange!([...(value ?? []), ...urls].slice(0, maxFiles));
      } catch {
        setError('Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [isControlled, onChange, value, maxFiles]
  );

  const addFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles || newFiles.length === 0) return;
      const arr = Array.from(newFiles).slice(0, remaining);
      if (arr.length === 0) return;

      if (isControlled) {
        void uploadAndAppend(arr);
      } else {
        setFiles((prev) => [...prev, ...arr].slice(0, maxFiles));
      }
    },
    [isControlled, uploadAndAppend, remaining, maxFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      if (isControlled) {
        const next = (value ?? []).filter((_, i) => i !== index);
        onChange!(next);
      } else {
        setFiles((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [isControlled, value, onChange]
  );

  // Notify parent (legacy File[] mode) after state settles — never during render
  const onFilesChangeRef = useRef(onFilesChange);
  onFilesChangeRef.current = onFilesChange;
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isControlled) {
      onFilesChangeRef.current?.(files);
    }
  }, [files, isControlled]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;
      addFiles(e.dataTransfer.files);
    },
    [addFiles, disabled]
  );

  return (
    <div className={cn('space-y-3', className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors duration-200',
          disabled
            ? 'cursor-not-allowed border-border/60 bg-muted/30 opacity-70'
            : 'cursor-pointer',
          !disabled && dragActive
            ? 'border-primary bg-primary/5'
            : !disabled && 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (disabled) return;
          inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        {uploading ? (
          <Loader2 className="mb-2 size-8 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="mb-2 size-8 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {currentCount}/{maxFiles}
          {counterLabel ? ` ${counterLabel}` : ''}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple && maxFiles > 1}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files);
            // Allow re-selecting the same file later
            if (inputRef.current) inputRef.current.value = '';
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* URL preview list — auto-upload (controlled) mode */}
      {isControlled && (value ?? []).length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(value ?? []).map((url, i) => {
            const isPdf = /\.pdf(\?|#|$)/i.test(url);
            return (
              <li
                key={`${url}-${i}`}
                className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
              >
                {isPdf ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full w-full flex-col items-center justify-center gap-1 bg-destructive/5 p-2 text-center"
                  >
                    <FileText className="size-8 text-destructive" />
                    <span className="line-clamp-2 text-xs font-medium text-foreground">
                      PDF
                    </span>
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={`Attachment ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  type="button"
                  aria-label="Remove attachment"
                  className="absolute end-1 top-1 cursor-pointer rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {/* File preview list — legacy File[] mode */}
      {!isControlled && files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              {file.type.startsWith('image/') ? (
                <ImageIcon className="size-5 text-primary" />
              ) : (
                <FileText className="size-5 text-destructive" />
              )}
              <span className="flex-1 truncate text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                type="button"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
              >
                <X className="size-3.5" />
                <span className="sr-only">Remove</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
