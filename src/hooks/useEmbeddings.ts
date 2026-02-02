import { useState, useEffect, useCallback } from 'react';
import {
  loadEmbeddingModel,
  generateQueryEmbedding,
  DEFAULT_MODEL_CONFIG,
  type EmbeddingModel,
  type EmbeddingModelConfig,
} from '@/utils/embeddings';

/**
 * Hook return type for embedding functionality
 */
export interface UseEmbeddingsResult {
  model: EmbeddingModel | null;
  isLoading: boolean;
  error: string | null;
  generateEmbedding: (text: string) => Float32Array | null;
}

/**
 * Hook for loading and using the embedding model
 * Loads the model once on mount and provides a function to generate embeddings
 */
export function useEmbeddings(
  config: EmbeddingModelConfig = DEFAULT_MODEL_CONFIG
): UseEmbeddingsResult {
  const [model, setModel] = useState<EmbeddingModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeModel() {
      try {
        setIsLoading(true);
        setError(null);

        const loadedModel = await loadEmbeddingModel(config);

        if (mounted) {
          setModel(loadedModel);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load embedding model:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load model');
          setIsLoading(false);
        }
      }
    }

    initializeModel();

    return () => {
      mounted = false;
    };
  }, [config]);

  /**
   * Generate an embedding for a query string
   * Returns null if model is not loaded
   * Memoized with useCallback to prevent unnecessary re-renders
   */
  const generateEmbedding = useCallback(
    (text: string): Float32Array | null => {
      if (!model) {
        return null;
      }

      try {
        return generateQueryEmbedding(text, model);
      } catch (err) {
        console.error('Failed to generate embedding:', err);
        return null;
      }
    },
    [model]
  );

  return {
    model,
    isLoading,
    error,
    generateEmbedding,
  };
}
