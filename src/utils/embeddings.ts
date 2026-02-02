import { DEFAULT_MODEL_CONFIG } from '@/lib/constants';

/**
 * Embedding model configuration
 */
export interface EmbeddingModelConfig {
  tokenizerUrl: string;
  embeddingsUrl: string;
  embeddingDim: number;
  dtype: 'F32' | 'F16';
}

/**
 * Vocabulary mapping tokens to IDs
 */
export interface TokenVocab {
  [token: string]: number;
}

/**
 * Loaded embedding model with vocabulary
 * Uses streaming to fetch embeddings on-demand via HTTP range requests
 */
export interface EmbeddingModel {
  vocab: TokenVocab;
  embeddingsUrl: string;
  embeddingDim: number;
  dtype: 'F32' | 'F16';
}

/**
 * Re-export DEFAULT_MODEL_CONFIG from constants for backwards compatibility
 */
export { DEFAULT_MODEL_CONFIG };

/**
 * Convert Float16 (half precision) to Float32
 * Float16 format: 1 sign bit, 5 exponent bits, 10 mantissa bits
 */
function float16ToFloat32(uint16: number): number {
  const sign = (uint16 & 0x8000) >> 15;
  const exponent = (uint16 & 0x7c00) >> 10;
  const fraction = uint16 & 0x03ff;

  // Handle special cases
  if (exponent === 0) {
    if (fraction === 0) {
      return sign ? -0 : 0;
    } else {
      return (sign ? -1 : 1) * Math.pow(2, -14) * (fraction / 1024);
    }
  } else if (exponent === 0x1f) {
    return fraction ? NaN : sign ? -Infinity : Infinity;
  }

  // Normal number
  const float32Exponent = exponent - 15 + 127;
  const float32Mantissa = fraction << 13;
  const float32Bits = (sign << 31) | (float32Exponent << 23) | float32Mantissa;

  const float32Array = new Float32Array(1);
  const uint32Array = new Uint32Array(float32Array.buffer);
  uint32Array[0] = float32Bits;

  return float32Array[0];
}

/**
 * Fetch embeddings for specific token IDs using HTTP range requests
 * Directly calculates byte offsets in embeddings.bin file
 */
async function fetchTokenEmbeddings(
  tokenIds: number[],
  model: EmbeddingModel
): Promise<Float32Array[]> {
  const bytesPerValue = model.dtype === 'F16' ? 2 : 4;

  // Fetch embeddings in parallel
  const embeddingPromises = tokenIds.map(async (tokenId) => {
    // Direct offset calculation: token_id × embedding_dim × bytes_per_value
    const byteStart = tokenId * model.embeddingDim * bytesPerValue;
    const byteEnd = byteStart + model.embeddingDim * bytesPerValue - 1;

    const response = await fetch(model.embeddingsUrl, {
      headers: { Range: `bytes=${byteStart}-${byteEnd}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch embedding for token ${tokenId}`);
    }

    const buffer = await response.arrayBuffer();

    // Convert based on dtype
    if (model.dtype === 'F16') {
      const uint16Array = new Uint16Array(buffer);
      const float32Array = new Float32Array(uint16Array.length);
      for (let i = 0; i < uint16Array.length; i++) {
        float32Array[i] = float16ToFloat32(uint16Array[i]);
      }
      return float32Array;
    } else {
      return new Float32Array(buffer);
    }
  });

  return Promise.all(embeddingPromises);
}

/**
 * Load the embedding model from remote URLs
 * Downloads tokenizer.json only (no embedding data downloaded)
 * Embeddings are fetched on-demand via HTTP range requests
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

  console.log('Model loaded (streaming mode):', {
    vocabSize: Object.keys(vocab).length,
    embeddingDim: config.embeddingDim,
    dtype: config.dtype,
    embeddingsUrl: config.embeddingsUrl,
  });

  return {
    vocab,
    embeddingsUrl: config.embeddingsUrl,
    embeddingDim: config.embeddingDim,
    dtype: config.dtype,
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
 * Fetches embeddings on-demand via HTTP range requests
 */
export async function generateQueryEmbedding(
  text: string,
  model: EmbeddingModel
): Promise<Float32Array> {
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

  // Fetch embeddings for tokens via HTTP range requests
  const embeddings = await fetchTokenEmbeddings(tokenIds, model);

  if (embeddings.length === 0) {
    console.warn('No valid embeddings found for tokens:', tokenIds);
    return new Float32Array(model.embeddingDim);
  }

  // Sum up embeddings for all tokens (mean pooling)
  const sum = new Float32Array(model.embeddingDim);

  for (const embedding of embeddings) {
    for (let i = 0; i < model.embeddingDim; i++) {
      sum[i] += embedding[i];
    }
  }

  const validTokenCount = embeddings.length;

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
