import type { DownloadLink } from '@/types';

interface DownloadsCardProps {
  download: string | DownloadLink[];
  format?: string;
}

/**
 * Card displaying download links
 */
export function DownloadsCard({ download, format }: DownloadsCardProps) {
  let links: DownloadLink[];

  if (typeof download === 'string') {
    // Single URL string
    links = [{ url: download, label: format || 'Download' }];
  } else if (Array.isArray(download)) {
    // Array of download objects
    links = download;
  } else {
    return null;
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Downloads
      </h2>
      <div className="space-y-2">
        {links.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="text-sm font-medium">{link.label}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
