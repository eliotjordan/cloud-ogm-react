import { describe, it, expect } from 'vitest';
import {
  normalizeVector,
  embeddingToSqlArray,
  cosineSimilarity,
  generateQueryEmbedding,
  type EmbeddingModel,
} from './embeddings';

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

describe('generateQueryEmbedding', () => {
  // Mock embedding model for testing
  const createMockModel = (): EmbeddingModel => {
    return {
      vocab: {
        '▁test': 0,
        '▁hello': 1,
        '▁world': 2,
        '▁water': 3,
        '▁resources': 4,
        '▁california': 5,
      },
      embeddings: new Float32Array([
        // Mock embeddings for token IDs 0-5 (3 dimensions each)
        1.0, 0.0, 0.0, // token 0: ▁test
        0.8, 0.6, 0.0, // token 1: ▁hello
        0.6, 0.8, 0.0, // token 2: ▁world
        0.0, 1.0, 0.0, // token 3: ▁water
        0.0, 0.8, 0.6, // token 4: ▁resources
        0.0, 0.6, 0.8, // token 5: ▁california
      ]),
      embeddingDim: 3,
    };
  };

  it('should generate normalized embedding for text', () => {
    const model = createMockModel();
    const embedding = generateQueryEmbedding('test', model);

    expect(embedding.length).toBe(3);

    // Check that the embedding is normalized
    const magnitude = Math.sqrt(
      embedding[0] * embedding[0] +
      embedding[1] * embedding[1] +
      embedding[2] * embedding[2]
    );
    expect(magnitude).toBeCloseTo(1.0);
  });

  it('should return zero vector for empty string', () => {
    const model = createMockModel();
    const embedding = generateQueryEmbedding('', model);

    expect(embedding.length).toBe(3);
    expect(embedding[0]).toBe(0);
    expect(embedding[1]).toBe(0);
    expect(embedding[2]).toBe(0);
  });

  it('should return zero vector for unknown tokens', () => {
    const model = createMockModel();
    const embedding = generateQueryEmbedding('unknown words here', model);

    expect(embedding.length).toBe(3);
    expect(embedding[0]).toBe(0);
    expect(embedding[1]).toBe(0);
    expect(embedding[2]).toBe(0);
  });

  it('should average embeddings from multiple tokens', () => {
    const model = createMockModel();
    const embedding = generateQueryEmbedding('water resources', model);

    expect(embedding.length).toBe(3);

    // Should be normalized to unit length
    const magnitude = Math.sqrt(
      embedding[0] * embedding[0] +
      embedding[1] * embedding[1] +
      embedding[2] * embedding[2]
    );
    expect(magnitude).toBeCloseTo(1.0);
  });
});
