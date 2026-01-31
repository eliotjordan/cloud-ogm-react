import Viewer from '@samvera/clover-iiif/viewer';

interface IIIFViewerProps {
  iiifContent: string;
  title?: string;
}

/**
 * IIIF viewer using Clover IIIF library
 * Supports both IIIF Presentation API (manifests) and Image API
 */
export function IIIFViewer({ iiifContent, title }: IIIFViewerProps) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          IIIF Viewer
        </h2>
        {title && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {title}
          </p>
        )}
      </div>
      <div className="h-[640px]">
        <Viewer iiifContent={iiifContent} />
      </div>
    </div>
  );
}
