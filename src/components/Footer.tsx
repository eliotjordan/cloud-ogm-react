/**
 * Application footer with copyright information
 */
export function Footer() {
  return (
    <footer className="mt-auto bg-primary-50 dark:bg-primary-950 border-t border-primary-200 dark:border-primary-800">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Cloud OpenGeoMetadata
        </p>
      </div>
    </footer>
  );
}
