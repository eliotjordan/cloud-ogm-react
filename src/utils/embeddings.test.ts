import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeVector,
  embeddingToSqlArray,
  cosineSimilarity,
  tokenizeSentencePiece,
  loadEmbeddingModel,
  generateQueryEmbedding,
  isValidEmbedding,
} from './embeddings';
import type { EmbeddingModelConfig } from './embeddings';

describe('normalizeVector', () => {
  it('should normalize a vector to unit length', () => {
    const vector = new Float32Array([3, 4]);
    const normalized = normalizeVector(vector);

    expect(normalized[0]).toBeCloseTo(0.6);
    expect(normalized[1]).toBeCloseTo(0.8);

    // Check that the magnitude is 1
    const magnitude = Math.sqrt(
      normalized[0] * normalized[0] + normalized[1] * normalized[1]
    );
    expect(magnitude).toBeCloseTo(1.0);
  });

  it('should handle zero vector', () => {
    const vector = new Float32Array([0, 0, 0]);
    const normalized = normalizeVector(vector);

    expect(normalized[0]).toBe(0);
    expect(normalized[1]).toBe(0);
    expect(normalized[2]).toBe(0);
  });

  it('should handle already normalized vector', () => {
    const vector = new Float32Array([1, 0, 0]);
    const normalized = normalizeVector(vector);

    expect(normalized[0]).toBeCloseTo(1.0);
    expect(normalized[1]).toBeCloseTo(0.0);
    expect(normalized[2]).toBeCloseTo(0.0);
  });

  it('should handle vector with NaN values', () => {
    const vector = new Float32Array([1, NaN, 3]);
    const normalized = normalizeVector(vector);

    // Should return zero vector for invalid input
    expect(normalized[0]).toBe(0);
    expect(normalized[1]).toBe(0);
    expect(normalized[2]).toBe(0);
  });

  it('should handle vector with Infinity values', () => {
    const vector = new Float32Array([1, Infinity, 3]);
    const normalized = normalizeVector(vector);

    // Should return zero vector for invalid input
    expect(normalized[0]).toBe(0);
    expect(normalized[1]).toBe(0);
    expect(normalized[2]).toBe(0);
  });
});

describe('embeddingToSqlArray', () => {
  it('should convert embedding to SQL array literal', () => {
    const embedding = new Float32Array([0.123456, -0.654321, 0.999999]);
    const sql = embeddingToSqlArray(embedding);

    expect(sql).toBe('ARRAY[0.123456, -0.654321, 0.999999]::FLOAT[]');
  });

  it('should format values to 6 decimal places', () => {
    const embedding = new Float32Array([0.123456789, -0.987654321]);
    const sql = embeddingToSqlArray(embedding);

    expect(sql).toBe('ARRAY[0.123457, -0.987654]::FLOAT[]');
  });

  it('should handle single value', () => {
    const embedding = new Float32Array([0.5]);
    const sql = embeddingToSqlArray(embedding);

    expect(sql).toBe('ARRAY[0.500000]::FLOAT[]');
  });

  it('should handle empty array', () => {
    const embedding = new Float32Array([]);
    const sql = embeddingToSqlArray(embedding);

    expect(sql).toBe('ARRAY[]::FLOAT[]');
  });
});

describe('cosineSimilarity', () => {
  it('should calculate cosine similarity for normalized vectors', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([1, 0, 0]);

    const similarity = cosineSimilarity(a, b);
    expect(similarity).toBeCloseTo(1.0);
  });

  it('should return 0 for orthogonal vectors', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([0, 1]);

    const similarity = cosineSimilarity(a, b);
    expect(similarity).toBeCloseTo(0.0);
  });

  it('should return negative for opposite vectors', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([-1, 0]);

    const similarity = cosineSimilarity(a, b);
    expect(similarity).toBeCloseTo(-1.0);
  });

  it('should throw error for mismatched dimensions', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([1, 0, 0]);

    expect(() => cosineSimilarity(a, b)).toThrow('Vectors must have the same dimension');
  });
});

describe('tokenizeSentencePiece', () => {
  it('should tokenize text with word boundary markers', () => {
    const vocab = {
      '▁hello': 1,
      '▁world': 2,
    };
    const tokens = tokenizeSentencePiece('hello world', vocab);

    expect(tokens).toEqual([1, 2]);
  });

  it('should handle lowercase normalization', () => {
    const vocab = {
      '▁hello': 1,
      '▁world': 2,
    };
    const tokens = tokenizeSentencePiece('HELLO WORLD', vocab);

    expect(tokens).toEqual([1, 2]);
  });

  it('should fall back to word without prefix', () => {
    const vocab = {
      hello: 1,
      '▁world': 2,
    };
    const tokens = tokenizeSentencePiece('hello world', vocab);

    expect(tokens).toEqual([1, 2]);
  });

  it('should skip unknown tokens', () => {
    const vocab = {
      '▁hello': 1,
    };
    const tokens = tokenizeSentencePiece('hello unknown world', vocab);

    expect(tokens).toEqual([1]);
  });

  it('should handle empty text', () => {
    const vocab = {
      '▁hello': 1,
    };
    const tokens = tokenizeSentencePiece('', vocab);

    expect(tokens).toEqual([]);
  });

  it('should handle multiple spaces', () => {
    const vocab = {
      '▁hello': 1,
      '▁world': 2,
    };
    const tokens = tokenizeSentencePiece('hello   world', vocab);

    expect(tokens).toEqual([1, 2]);
  });
});

describe('loadEmbeddingModel', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should load model with vocab from tokenizer.json', async () => {
    const mockTokenizerData = {
      model: {
        vocab: [
          ['▁hello', -1.0],
          ['▁world', -2.0],
          ['▁test', -3.0],
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTokenizerData,
    } as Response);

    const config: EmbeddingModelConfig = {
      tokenizerUrl: 'http://test.com/tokenizer.json',
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 256,
      dtype: 'F32',
    };

    const model = await loadEmbeddingModel(config);

    expect(model.vocab).toEqual({
      '▁hello': 0,
      '▁world': 1,
      '▁test': 2,
    });
    expect(model.embeddingDim).toBe(256);
    expect(model.dtype).toBe('F32');
    expect(model.embeddingsUrl).toBe('http://test.com/embeddings.bin');
  });

  it('should handle tokenizer with non-array vocab entries', async () => {
    const mockTokenizerData = {
      model: {
        vocab: [
          ['▁hello', -1.0],
          'invalid',
          ['▁world', -2.0],
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTokenizerData,
    } as Response);

    const config: EmbeddingModelConfig = {
      tokenizerUrl: 'http://test.com/tokenizer.json',
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 128,
      dtype: 'F32',
    };

    const model = await loadEmbeddingModel(config);

    expect(model.vocab).toEqual({
      '▁hello': 0,
      '▁world': 2,
    });
  });

  it('should throw error when tokenizer fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    const config: EmbeddingModelConfig = {
      tokenizerUrl: 'http://test.com/tokenizer.json',
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 256,
      dtype: 'F32',
    };

    await expect(loadEmbeddingModel(config)).rejects.toThrow('Failed to load tokenizer');
  });

  it('should throw error when no vocabulary found', async () => {
    const mockTokenizerData = {
      model: {
        vocab: [],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTokenizerData,
    } as Response);

    const config: EmbeddingModelConfig = {
      tokenizerUrl: 'http://test.com/tokenizer.json',
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 256,
      dtype: 'F32',
    };

    await expect(loadEmbeddingModel(config)).rejects.toThrow('No vocabulary found');
  });

  it('should throw error when vocab is missing', async () => {
    const mockTokenizerData = {
      model: {},
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTokenizerData,
    } as Response);

    const config: EmbeddingModelConfig = {
      tokenizerUrl: 'http://test.com/tokenizer.json',
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 256,
      dtype: 'F32',
    };

    await expect(loadEmbeddingModel(config)).rejects.toThrow('No vocabulary found');
  });
});

describe('generateQueryEmbedding', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should generate normalized embedding for text with F32', async () => {
    const model = {
      vocab: {
        '▁hello': 0,
        '▁world': 1,
      },
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 3,
      dtype: 'F32' as const,
    };

    // Mock embeddings: [3, 4, 0] and [0, 0, 5]
    const embedding1 = new Float32Array([3, 4, 0]);
    const embedding2 = new Float32Array([0, 0, 5]);

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => embedding1.buffer,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => embedding2.buffer,
      } as Response);

    const result = await generateQueryEmbedding('hello world', model);

    // Mean: [(3+0)/2, (4+0)/2, (0+5)/2] = [1.5, 2, 2.5]
    // Normalized should be unit length
    expect(result.length).toBe(3);

    const magnitude = Math.sqrt(
      result[0] * result[0] + result[1] * result[1] + result[2] * result[2]
    );
    expect(magnitude).toBeCloseTo(1.0);
  });

  it('should generate normalized embedding with F16 dtype', async () => {
    const model = {
      vocab: {
        '▁test': 0,
      },
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 2,
      dtype: 'F16' as const,
    };

    // Create F16 representation: 0x3C00 = 1.0, 0x4000 = 2.0
    const uint16Array = new Uint16Array([0x3c00, 0x4000]);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => uint16Array.buffer,
    } as Response);

    const result = await generateQueryEmbedding('test', model);

    expect(result.length).toBe(2);

    // Result should be normalized
    const magnitude = Math.sqrt(result[0] * result[0] + result[1] * result[1]);
    expect(magnitude).toBeCloseTo(1.0);
  });

  it('should return zero vector for empty text', async () => {
    const model = {
      vocab: {
        '▁hello': 0,
      },
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 3,
      dtype: 'F32' as const,
    };

    const result = await generateQueryEmbedding('', model);

    expect(result.length).toBe(3);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(0);
  });

  it('should return zero vector for unknown tokens', async () => {
    const model = {
      vocab: {
        '▁hello': 0,
      },
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 3,
      dtype: 'F32' as const,
    };

    const result = await generateQueryEmbedding('unknown', model);

    expect(result.length).toBe(3);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(0);
  });

  it('should handle fetch errors gracefully', async () => {
    const model = {
      vocab: {
        '▁test': 0,
      },
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 3,
      dtype: 'F32' as const,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Server Error',
    } as Response);

    await expect(generateQueryEmbedding('test', model)).rejects.toThrow(
      'Failed to fetch embedding for token'
    );
  });

  it('should handle NaN in embeddings', async () => {
    const model = {
      vocab: {
        '▁test': 0,
      },
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 3,
      dtype: 'F32' as const,
    };

    const embedding = new Float32Array([NaN, 1, 2]);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => embedding.buffer,
    } as Response);

    const result = await generateQueryEmbedding('test', model);

    // Should return zero vector when NaN detected
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(0);
  });

  it('should handle special F16 values', async () => {
    const model = {
      vocab: {
        '▁test': 0,
      },
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 4,
      dtype: 'F16' as const,
    };

    // F16 special values:
    // 0x0000 = +0, 0x8000 = -0
    // 0x7C00 = +Infinity, 0xFC00 = -Infinity
    // 0x7C01 = NaN
    const uint16Array = new Uint16Array([0x0000, 0x8000, 0x7c00, 0x7c01]);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => uint16Array.buffer,
    } as Response);

    const result = await generateQueryEmbedding('test', model);

    // With Infinity and NaN, should return zero vector
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(0);
    expect(result[3]).toBe(0);
  });

  it('should handle subnormal F16 numbers', async () => {
    const model = {
      vocab: {
        '▁test': 0,
      },
      embeddingsUrl: 'http://test.com/embeddings.bin',
      embeddingDim: 2,
      dtype: 'F16' as const,
    };

    // Subnormal F16: exponent=0, fraction≠0
    // 0x0001 = smallest positive subnormal
    // 0x8001 = smallest negative subnormal
    const uint16Array = new Uint16Array([0x0001, 0x8001]);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => uint16Array.buffer,
    } as Response);

    const result = await generateQueryEmbedding('test', model);

    expect(result.length).toBe(2);
    // Result should be normalized (even with very small values)
    const magnitude = Math.sqrt(result[0] * result[0] + result[1] * result[1]);
    expect(magnitude).toBeCloseTo(1.0);
  });
});

describe('isValidEmbedding', () => {
  it('should return true for a valid embedding', () => {
    expect(isValidEmbedding(new Float32Array([0.1, 0.2, 0.3]))).toBe(true);
  });

  it('should return false for null', () => {
    expect(isValidEmbedding(null)).toBe(false);
  });

  it('should return false for empty array', () => {
    expect(isValidEmbedding(new Float32Array([]))).toBe(false);
  });

  it('should return false for all-zero vector', () => {
    expect(isValidEmbedding(new Float32Array([0, 0, 0]))).toBe(false);
  });

  it('should return false when containing NaN', () => {
    expect(isValidEmbedding(new Float32Array([1, NaN, 3]))).toBe(false);
  });

  it('should return false when containing Infinity', () => {
    expect(isValidEmbedding(new Float32Array([1, Infinity]))).toBe(false);
  });

  it('should return false when containing -Infinity', () => {
    expect(isValidEmbedding(new Float32Array([-Infinity, 1]))).toBe(false);
  });

  it('should return true when at least one value is non-zero', () => {
    expect(isValidEmbedding(new Float32Array([0, 0, 0.001]))).toBe(true);
  });
});
