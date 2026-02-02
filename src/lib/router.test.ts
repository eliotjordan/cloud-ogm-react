import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  parseHash,
  navigate,
  buildSearchUrl,
  updateSearchParams,
  toggleFilter,
  clearFilters,
} from './router';

describe('parseHash', () => {
  // Store original hash
  let originalHash: string;

  beforeEach(() => {
    originalHash = window.location.hash;
  });

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('should parse home route', () => {
    window.location.hash = '#/';
    const route = parseHash();
    expect(route.route).toBe('home');
    expect(route.path).toBe('/');
    expect(route.params).toEqual([]);
    expect(route.query).toEqual({});
  });

  it('should parse search route', () => {
    window.location.hash = '#/search';
    const route = parseHash();
    expect(route.route).toBe('search');
    expect(route.path).toBe('/search');
    expect(route.params).toEqual([]);
  });

  it('should parse search route with query parameters', () => {
    window.location.hash = '#/search?q=test&provider=Stanford';
    const route = parseHash();
    expect(route.route).toBe('search');
    expect(route.query).toEqual({
      q: 'test',
      provider: 'Stanford',
    });
  });

  it('should parse item route with ID', () => {
    window.location.hash = '#/item/abc123';
    const route = parseHash();
    expect(route.route).toBe('item');
    expect(route.params).toEqual(['abc123']);
  });

  it('should convert page parameter to number', () => {
    window.location.hash = '#/search?page=5';
    const route = parseHash();
    expect(route.query.page).toBe(5);
    expect(typeof route.query.page).toBe('number');
  });

  it('should convert threshold parameter to float', () => {
    window.location.hash = '#/search?threshold=0.75';
    const route = parseHash();
    expect(route.query.threshold).toBe(0.75);
    expect(typeof route.query.threshold).toBe('number');
  });

  it('should handle empty hash', () => {
    window.location.hash = '';
    const route = parseHash();
    expect(route.route).toBe('home');
    expect(route.path).toBe('/');
  });

  it('should handle hash without leading slash', () => {
    window.location.hash = '#search';
    const route = parseHash();
    expect(route.route).toBe('search');
  });
});

describe('navigate', () => {
  let originalHash: string;

  beforeEach(() => {
    originalHash = window.location.hash;
  });

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('should update window.location.hash', () => {
    navigate('/search?q=test');
    expect(window.location.hash).toBe('#/search?q=test');
  });

  it('should navigate to home', () => {
    navigate('/');
    expect(window.location.hash).toBe('#/');
  });
});

describe('buildSearchUrl', () => {
  it('should build URL with single parameter', () => {
    const url = buildSearchUrl({ q: 'test' });
    expect(url).toBe('#/search?q=test');
  });

  it('should build URL with multiple parameters', () => {
    const url = buildSearchUrl({ q: 'map', provider: 'Stanford', page: 2 });
    expect(url).toContain('q=map');
    expect(url).toContain('provider=Stanford');
    expect(url).toContain('page=2');
  });

  it('should exclude undefined and empty values', () => {
    const url = buildSearchUrl({
      q: 'test',
      provider: undefined,
      location: undefined,
      bbox: '',
    });
    expect(url).toBe('#/search?q=test');
  });

  it('should return base URL when no parameters', () => {
    const url = buildSearchUrl({});
    expect(url).toBe('#/search');
  });

  it('should handle special characters in values', () => {
    const url = buildSearchUrl({ q: 'test & special' });
    expect(url).toContain('test+%26+special');
  });
});

describe('updateSearchParams', () => {
  let originalHash: string;

  beforeEach(() => {
    originalHash = window.location.hash;
    window.location.hash = '#/search?q=initial';
  });

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('should update existing parameter', () => {
    updateSearchParams({ q: 'updated' });
    const route = parseHash();
    expect(route.query.q).toBe('updated');
  });

  it('should add new parameter', () => {
    updateSearchParams({ provider: 'Stanford' });
    const route = parseHash();
    expect(route.query.q).toBe('initial');
    expect(route.query.provider).toBe('Stanford');
  });

  it('should remove parameter when set to undefined', () => {
    window.location.hash = '#/search?q=test&provider=Stanford';
    updateSearchParams({ provider: undefined });
    const route = parseHash();
    expect(route.query.q).toBe('test');
    expect(route.query.provider).toBeUndefined();
  });

  it('should remove parameter when set to null', () => {
    window.location.hash = '#/search?q=test&provider=Stanford';
    updateSearchParams({ provider: null as any });
    const route = parseHash();
    expect(route.query.provider).toBeUndefined();
  });
});

describe('toggleFilter', () => {
  let originalHash: string;

  beforeEach(() => {
    originalHash = window.location.hash;
    window.location.hash = '#/search';
  });

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('should add filter when not active', () => {
    toggleFilter('provider', 'Stanford', false);
    const route = parseHash();
    expect(route.query.provider).toBe('Stanford');
  });

  it('should remove filter when active', () => {
    window.location.hash = '#/search?provider=Stanford';
    toggleFilter('provider', 'Stanford', true);
    const route = parseHash();
    expect(route.query.provider).toBeUndefined();
  });

  it('should add to existing filter values', () => {
    window.location.hash = '#/search?provider=Stanford';
    toggleFilter('provider', 'MIT', false);
    const route = parseHash();
    expect(route.query.provider).toBe('Stanford,MIT');
  });

  it('should remove from multiple filter values', () => {
    window.location.hash = '#/search?provider=Stanford,MIT,Harvard';
    toggleFilter('provider', 'MIT', true);
    const route = parseHash();
    expect(route.query.provider).toBe('Stanford,Harvard');
  });

  it('should reset page to 1 when toggling filter', () => {
    window.location.hash = '#/search?page=5';
    toggleFilter('provider', 'Stanford', false);
    const route = parseHash();
    expect(route.query.page).toBe(1);
  });

  it('should remove filter field when no values remain', () => {
    window.location.hash = '#/search?provider=Stanford';
    toggleFilter('provider', 'Stanford', true);
    const route = parseHash();
    expect(route.query.provider).toBeUndefined();
  });
});

describe('clearFilters', () => {
  let originalHash: string;

  beforeEach(() => {
    originalHash = window.location.hash;
  });

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('should clear all filters except q and bbox', () => {
    window.location.hash = '#/search?q=test&bbox=1,2,3,4&provider=Stanford&page=2';
    clearFilters();
    const route = parseHash();
    expect(route.query.q).toBe('test');
    expect(route.query.bbox).toBe('1,2,3,4');
    expect(route.query.provider).toBeUndefined();
    expect(route.query.page).toBeUndefined();
  });

  it('should keep only query text', () => {
    window.location.hash = '#/search?q=map&provider=Stanford';
    clearFilters();
    const route = parseHash();
    expect(route.query.q).toBe('map');
    expect(route.query.provider).toBeUndefined();
  });

  it('should keep only bbox', () => {
    window.location.hash = '#/search?bbox=-122,37,-121,38&provider=Stanford';
    clearFilters();
    const route = parseHash();
    expect(route.query.bbox).toBe('-122,37,-121,38');
    expect(route.query.provider).toBeUndefined();
  });

  it('should clear everything if no q or bbox', () => {
    window.location.hash = '#/search?provider=Stanford&page=2';
    clearFilters();
    const route = parseHash();
    expect(Object.keys(route.query).length).toBe(0);
  });
});
