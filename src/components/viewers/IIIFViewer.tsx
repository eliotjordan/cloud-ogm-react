import Viewer from '@samvera/clover-iiif/viewer';

interface IIIFViewerProps {
  iiifContent: string;
  title?: string;
}

/**
 * Normalize ContentDM IIIF URLs to use the correct /2/ format
 * ContentDM URLs redirect from /iiif/... to /iiif/2/... which can cause loading issues
 */
function normalizeIIIFUrl(url: string): string {
  // Fix ContentDM URLs: add /2/ if it's missing
  if (url.includes('contentdm.oclc.org/iiif/') && !url.includes('/iiif/2/')) {
    return url.replace('/iiif/', '/iiif/2/');
  }
  return url;
}

/**
 * IIIF viewer using Clover IIIF library
 * Supports both IIIF Presentation API (manifests) and Image API
 */
export function IIIFViewer({ iiifContent, title }: IIIFViewerProps) {
  const normalizedUrl = normalizeIIIFUrl(iiifContent);
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
      <div className="h-[640px] w-full">
        <Viewer
          iiifContent={normalizedUrl}
          options={{
            showTitle: false,
          }}
        />
      </div>
    </div>
  );
}
