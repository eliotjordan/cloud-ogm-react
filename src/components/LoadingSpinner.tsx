import { useEffect, useState } from 'react';

/**
 * Loading spinner component with animated progress indicators
 * Used during DuckDB initialization and data loading
 */
export function LoadingSpinner({ message }: { message?: string }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      label: 'Initializing database engine',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      ),
    },
    {
      label: 'Loading spatial extensions',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Connecting to metadata',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      ),
    },
    {
      label: 'Preparing search index',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {/* Animated Globe Icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="relative">
          <svg
            className="w-24 h-24 text-primary-600 dark:text-primary-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <circle
              className="animate-ping opacity-20"
              cx="12"
              cy="12"
              r="10"
              strokeWidth="1"
            />
            <path
              className="animate-spin-slow"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 2a10 10 0 0 0 0 20M12 2a10 10 0 0 1 0 20"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M2 12h20"
            />
          </svg>
        </div>
      </div>

      {/* Main Title */}
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {message || 'Loading OpenGeoMetadata'}
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Preparing your search experience...
      </p>

      {/* Progress Steps */}
      <div className="w-full max-w-md space-y-3">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 scale-105'
                  : 'bg-gray-50 dark:bg-gray-800/50'
              }`}
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/50'
                    : isCompleted
                      ? 'bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {isActive ? (
                  <div className="animate-bounce">{step.icon}</div>
                ) : (
                  step.icon
                )}
              </div>

              {/* Label */}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-900 dark:text-primary-100'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
              </div>

              {/* Loading Indicator */}
              {isActive && (
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mt-6">
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-1000 ease-out rounded-full"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Additional Info */}
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-6 text-center max-w-md">
        Loading DuckDB-WASM database engine for client-side queries.
        <br />
        This happens once per session and typically takes 2-5 seconds.
      </p>
    </div>
  );
}
