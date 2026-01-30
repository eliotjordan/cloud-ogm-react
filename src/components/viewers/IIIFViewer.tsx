import { useEffect, useRef } from 'react';

interface IIIFViewerProps {
  manifestUrl: string;
  title?: string;
}

/**
 * IIIF Manifest viewer using TIFY library
 */
export function IIIFViewer({ manifestUrl, title }: IIIFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tifyRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || tifyRef.current) return;

    // Lazy load TIFY
    import('tify').then((Tify) => {
      if (!containerRef.current) return;

      tifyRef.current = new (Tify.default || Tify)({
        container: containerRef.current,
        manifestUrl: manifestUrl,
      });
    }).catch((error) => {
      console.error('Failed to load TIFY viewer:', error);
    });

    return () => {
      if (tifyRef.current && typeof tifyRef.current.destroy === 'function') {
        tifyRef.current.destroy();
        tifyRef.current = null;
      }
    };
  }, [manifestUrl]);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          IIIF Manifest Viewer
        </h2>
        {title && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {title}
          </p>
        )}
      </div>
      <div ref={containerRef} className="h-[640px]" />
    </div>
  );
}
