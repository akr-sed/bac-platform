'use client';

import { useState } from 'react';

interface AttachmentViewerProps {
  attachments: string[];
}

type AttachmentType = 'image' | 'pdf' | 'file';

function getType(url: string): AttachmentType {
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/.test(lower) || url.includes('/image/upload/')) {
    return 'image';
  }
  if (lower.includes('.pdf') || url.includes('/raw/upload/')) {
    return 'pdf';
  }
  return 'file';
}

function getFilename(url: string): string {
  return decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? 'file');
}

function ImageAttachment({ url }: { url: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
        type="button"
      >
        <img
          src={url}
          alt={getFilename(url)}
          className={`w-full object-contain transition-all duration-200 ${
            expanded ? 'max-h-[600px]' : 'max-h-48'
          }`}
        />
      </button>
      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
        <span className="truncate text-xs text-slate-500">{getFilename(url)}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 shrink-0 text-xs text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Open ↗
        </a>
      </div>
    </div>
  );
}

function PdfAttachment({ url }: { url: string }) {
  const [showEmbed, setShowEmbed] = useState(false);
  const filename = getFilename(url);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {showEmbed ? (
        <object
          data={url}
          type="application/pdf"
          className="h-[500px] w-full"
          aria-label={filename}
        >
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-slate-500">
              Your browser cannot display this PDF inline.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              style={{ color: '#ffffff' }}
            >
              Open PDF in new tab ↗
            </a>
          </div>
        </object>
      ) : (
        <div className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
              <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{filename}</p>
            <p className="text-xs text-slate-500">PDF Document</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmbed(true)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Preview
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
              style={{ color: '#ffffff' }}
            >
              Open ↗
            </a>
          </div>
        </div>
      )}
      {showEmbed && (
        <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
          <span className="truncate text-xs text-slate-500">{filename}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmbed(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Collapse
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Open in new tab ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttachmentViewer({ attachments }: AttachmentViewerProps) {
  if (!attachments.length) return null;

  const images = attachments.filter((u) => getType(u) === 'image');
  const pdfs = attachments.filter((u) => getType(u) === 'pdf');
  const others = attachments.filter((u) => getType(u) === 'file');

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Attachments ({attachments.length})
      </h3>

      {images.length > 0 && (
        <div className={`grid gap-3 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {images.map((url, i) => (
            <ImageAttachment key={i} url={url} />
          ))}
        </div>
      )}

      {pdfs.length > 0 && (
        <div className="space-y-3">
          {pdfs.map((url, i) => (
            <PdfAttachment key={i} url={url} />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-2">
          {others.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-slate-400">
                <path fillRule="evenodd" d="M19.902 4.098a3.75 3.75 0 00-5.304 0l-4.5 4.5a3.75 3.75 0 001.035 6.037.75.75 0 01-.646 1.353 5.25 5.25 0 01-1.449-8.45l4.5-4.5a5.25 5.25 0 117.424 7.424l-1.757 1.757a.75.75 0 11-1.06-1.06l1.757-1.757a3.75 3.75 0 000-5.304zm-7.389 4.267a.75.75 0 011-.353 5.25 5.25 0 011.449 8.45l-4.5 4.5a5.25 5.25 0 11-7.424-7.424l1.757-1.757a.75.75 0 111.06 1.06l-1.757 1.757a3.75 3.75 0 105.304 5.304l4.5-4.5a3.75 3.75 0 00-1.035-6.037.75.75 0 01-.353-1z" clipRule="evenodd" />
              </svg>
              <span className="flex-1 truncate">{getFilename(url)}</span>
              <span className="text-xs text-slate-400">Open ↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
