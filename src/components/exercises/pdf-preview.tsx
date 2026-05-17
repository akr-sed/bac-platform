'use client';

import { useState } from 'react';
import { Maximize2, Minimize2, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfPreviewProps {
  url: string;
  filename?: string;
}

export function PdfPreview({ url, filename }: PdfPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const displayName = filename ?? url.split('/').pop()?.split('?')[0] ?? 'document.pdf';
  // Google Docs Viewer renders any public PDF inline — reliable fallback
  // for Cloudinary raw URLs that set Content-Disposition: attachment
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText className="size-4 shrink-0 text-destructive" />
          <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
          <a
            href={viewerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            aria-label="Open in new tab"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>

      {/* PDF iframe */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{ height: expanded ? '80vh' : '300px' }}
      >
        <iframe
          src={viewerUrl}
          title={displayName}
          className="size-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
