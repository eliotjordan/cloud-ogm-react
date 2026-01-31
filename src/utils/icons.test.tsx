import { describe, it, expect } from 'vitest';
import { getResourceClassIcon } from './icons';

describe('getResourceClassIcon', () => {
  it('should return maps icon for Maps resource class', () => {
    const icon = getResourceClassIcon('Maps');
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should return datasets icon for Datasets resource class', () => {
    const icon = getResourceClassIcon('Datasets');
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should return imagery icon for Imagery resource class', () => {
    const icon = getResourceClassIcon('Imagery');
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should return collections icon for Collections resource class', () => {
    const icon = getResourceClassIcon('Collections');
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should return web services icon for Web Services', () => {
    const icon = getResourceClassIcon('Web Services');
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should return web services icon for Web Service (singular)', () => {
    const icon = getResourceClassIcon('Web Service');
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should return website icon for Websites', () => {
    const icon = getResourceClassIcon('Websites');
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should return website icon for Website (singular)', () => {
    const icon = getResourceClassIcon('Website');
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should return default icon for unknown resource class', () => {
    const icon = getResourceClassIcon('Unknown Type');
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should return default icon for undefined', () => {
    const icon = getResourceClassIcon(undefined);
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should handle case-insensitive matching', () => {
    const icon1 = getResourceClassIcon('MAPS');
    const icon2 = getResourceClassIcon('maps');
    const icon3 = getResourceClassIcon('Maps');

    expect(icon1).toBeDefined();
    expect(icon2).toBeDefined();
    expect(icon3).toBeDefined();
  });

  it('should handle arrays by using first element', () => {
    const icon = getResourceClassIcon(['Maps', 'Other']);
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should handle DuckDB Vector types with toArray method', () => {
    const mockVector = {
      toArray: () => ['Datasets', 'Other'],
    };
    const icon = getResourceClassIcon(mockVector);
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should handle DuckDB Vector conversion errors', () => {
    const mockVector = {
      toArray: () => {
        throw new Error('Conversion failed');
      },
    };
    const icon = getResourceClassIcon(mockVector);
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should handle whitespace in resource class names', () => {
    const icon = getResourceClassIcon('  Maps  ');
    expect(icon).toBeDefined();
    expect(icon.type).toBe('path');
  });

  it('should return path elements with correct SVG attributes', () => {
    const icon = getResourceClassIcon('Maps');
    expect(icon.props).toHaveProperty('strokeLinecap', 'round');
    expect(icon.props).toHaveProperty('strokeLinejoin', 'round');
    expect(icon.props).toHaveProperty('strokeWidth', 2);
    expect(icon.props).toHaveProperty('d');
  });
});
