import { DEFAULT_MODEL_CONFIG } from '@/lib/constants';

/**
 * Embedding model configuration
 */
export interface EmbeddingModelConfig {
  tokenizerUrl: string;
  embeddingsUrl: string;
  embeddingDim: number;
}

/**
 * Vocabulary mapping tokens to IDs
 */
export interface TokenVocab {
  [token: string]: number;
}

/**
 * Loaded embedding model with vocabulary and embedding matrix
 */
export interface EmbeddingModel {
  vocab: TokenVocab;
  embeddings: Float32Array;
  embeddingDim: number;
}

/**
 * Re-export DEFAULT_MODEL_CONFIG from constants for backwards compatibility
 */
export { DEFAULT_MODEL_CONFIG };

/**
 * Load the embedding model from remote URLs
 * Downloads tokenizer.json and embeddings.bin files
 */
export async function loadEmbeddingModel(
  config: EmbeddingModelConfig = DEFAULT_MODEL_CONFIG
): Promise<EmbeddingModel> {
  // Fetch tokenizer.json
  const tokenizerResponse = await fetch(config.tokenizerUrl);
  if (!tokenizerResponse.ok) {
    throw new Error(`Failed to load tokenizer: ${tokenizerResponse.statusText}`);
  }
  const tokenizerData = await tokenizerResponse.json();

  // Extract vocabulary from Unigram model (array of [token, score] tuples)
  const vocab: TokenVocab = {};

  if (tokenizerData.model?.vocab && Array.isArray(tokenizerData.model.vocab)) {
    for (let i = 0; i < tokenizerData.model.vocab.length; i++) {
      const entry = tokenizerData.model.vocab[i];
      if (Array.isArray(entry) && entry.length >= 1) {
        const token = entry[0];
        if (typeof token === 'string') {
          vocab[token] = i;
        }
      }
    }
  }

  if (Object.keys(vocab).length === 0) {
    throw new Error('No vocabulary found in tokenizer.json');
  }

  console.log('Loaded vocabulary:', {
    size: Object.keys(vocab).length,
    sampleTokens: Object.keys(vocab).slice(0, 20),
  });

  // Load embedding matrix
  const embeddingsResponse = await fetch(config.embeddingsUrl);
  if (!embeddingsResponse.ok) {
    throw new Error(`Failed to load embeddings: ${embeddingsResponse.statusText}`);
  }

  const buffer = await embeddingsResponse.arrayBuffer();
  const embeddings = new Float32Array(buffer);

  return {
    vocab,
    embeddings,
    embeddingDim: config.embeddingDim,
  };
}

/**
 * Tokenize text for SentencePiece-style vocabulary
 * Handles the ▁ character that represents word boundaries
 */
export function tokenizeSentencePiece(text: string, vocab: TokenVocab): number[] {
  // Normalize: lowercase
  text = text.toLowerCase();

  // Split into words
  const words = text.trim().split(/\s+/);

  const tokenIds: number[] = [];

  for (const word of words) {
    // Try the word with ▁ prefix (word boundary marker)
    const wordWithPrefix = '▁' + word;

    if (vocab[wordWithPrefix] !== undefined) {
      tokenIds.push(vocab[wordWithPrefix]);
    } else if (vocab[word] !== undefined) {
      // Try without prefix
      tokenIds.push(vocab[word]);
    }
    // If token not found, skip it (could add [UNK] token handling here)
  }

  return tokenIds;
}

/**
 * Generate an embedding vector for a query string
 * Uses mean pooling over token embeddings and L2 normalization
 */
export function generateQueryEmbedding(
  text: string,
  model: EmbeddingModel
): Float32Array {
  // Tokenize using SentencePiece-style tokenization
  const tokenIds = tokenizeSentencePiece(text, model.vocab);

  if (tokenIds.length === 0) {
    console.warn('No tokens found for text:', text);
    // Return zero vector for empty input
    return new Float32Array(model.embeddingDim);
  }

  console.log('Tokenization result:', {
    text,
    tokenCount: tokenIds.length,
    tokenIds: tokenIds.slice(0, 10),
  });

  // Sum up embeddings for all tokens (mean pooling)
  const sum = new Float32Array(model.embeddingDim);
  let validTokenCount = 0;

  for (const tokenId of tokenIds) {
    // Skip out-of-range IDs
    if (tokenId < 0 || tokenId * model.embeddingDim >= model.embeddings.length) {
      continue;
    }

    const offset = tokenId * model.embeddingDim;
    for (let i = 0; i < model.embeddingDim; i++) {
      sum[i] += model.embeddings[offset + i];
    }
    validTokenCount++;
  }

  // If no valid embeddings were found, return zero vector
  if (validTokenCount === 0) {
    console.warn('No valid embeddings found for tokens:', tokenIds);
    return new Float32Array(model.embeddingDim);
  }

  // Average the embeddings
  for (let i = 0; i < model.embeddingDim; i++) {
    sum[i] /= validTokenCount;
  }

  // L2 normalize the embedding
  const normalized = normalizeVector(sum);

  // Validate result doesn't contain NaN
  for (let i = 0; i < normalized.length; i++) {
    if (isNaN(normalized[i])) {
      console.error('NaN detected in embedding after normalization');
      return new Float32Array(model.embeddingDim);
    }
  }

  return normalized;
}

/**
 * L2 normalize a vector (make it unit length)
 * Required for cosine similarity calculation
 * Returns zero vector if input is zero or contains invalid values
 */
export function normalizeVector(vector: Float32Array): Float32Array {
  let magnitude = 0;
  for (let i = 0; i < vector.length; i++) {
    if (isNaN(vector[i]) || !isFinite(vector[i])) {
      console.warn('Invalid value in vector before normalization');
      return new Float32Array(vector.length);
    }
    magnitude += vector[i] * vector[i];
  }
  magnitude = Math.sqrt(magnitude);

  // Return zero vector if magnitude is zero or invalid
  if (magnitude === 0 || isNaN(magnitude) || !isFinite(magnitude)) {
    return new Float32Array(vector.length);
  }

  const normalized = new Float32Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    normalized[i] = vector[i] / magnitude;
  }

  return normalized;
}

/**
 * Convert a Float32Array embedding to a SQL array literal
 * Format: ARRAY[0.123, -0.456, ...]::FLOAT[]
 */
export function embeddingToSqlArray(embedding: Float32Array): string {
  const values = Array.from(embedding).map((v) => v.toFixed(6));
  return `ARRAY[${values.join(', ')}]::FLOAT[]`;
}

/**
 * Calculate cosine similarity between two vectors
 * Both vectors must be normalized for accurate results
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  return dotProduct;
}
