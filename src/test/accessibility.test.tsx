import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FacetPanel } from '@/components/search/FacetPanel';
import type { FieldConfig, FacetValue } from '@/types';

/**
 * Accessibility tests for semantic HTML structure
 * These tests ensure WCAG compliance and proper heading hierarchy
 */

describe('Accessibility - Heading Hierarchy', () => {
  describe('FacetPanel', () => {
    const mockConfig: FieldConfig = {
      field: 'provider',
      label: 'Provider',
      isArray: false,
      facetable: true,
      displayOnCard: true,
      displayOnItem: true,
    };

    const mockValues: FacetValue[] = [
      { value: 'Stanford', count: 100 },
      { value: 'MIT', count: 50 },
    ];

    it('should use h2 for facet panel heading', () => {
      const { container } = render(
        <FacetPanel config={mockConfig} values={mockValues} selectedValues={[]} />
      );

      const heading = container.querySelector('h2');
      expect(heading).toBeTruthy();
      expect(heading?.textContent).toBe('Provider');
    });

    it('should not use h3 for main facet heading', () => {
      const { container } = render(
        <FacetPanel config={mockConfig} values={mockValues} selectedValues={[]} />
      );

      // The main heading should be h2, not h3
      const mainHeading = container.querySelector('button h3');
      expect(mainHeading).toBeNull();
    });

    it('should have proper ARIA attributes for collapsible panel', () => {
      const { container } = render(
        <FacetPanel config={mockConfig} values={mockValues} selectedValues={[]} />
      );

      const button = container.querySelector('button[aria-expanded]');
      expect(button).toBeTruthy();
      expect(button?.getAttribute('aria-expanded')).toBeDefined();
    });
  });
});

describe('Accessibility - Form Controls', () => {
  describe('FacetPanel checkboxes', () => {
    const mockConfig: FieldConfig = {
      field: 'location',
      label: 'Place',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };

    const mockValues: FacetValue[] = [
      { value: 'Paris', count: 500 },
      { value: 'London', count: 300 },
    ];

    it('should associate labels with checkboxes', () => {
      // Start with selected value so panel is expanded
      const { container } = render(
        <FacetPanel config={mockConfig} values={mockValues} selectedValues={['Paris']} />
      );

      const labels = container.querySelectorAll('label');
      expect(labels.length).toBeGreaterThan(0);

      labels.forEach((label) => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        expect(checkbox).toBeTruthy();
      });
    });

    it('should have accessible checkboxes with proper attributes', () => {
      // Start with selected value so panel is expanded
      const { container } = render(
        <FacetPanel config={mockConfig} values={mockValues} selectedValues={['Paris']} />
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(2);

      checkboxes.forEach((checkbox) => {
        expect(checkbox.getAttribute('type')).toBe('checkbox');
        expect(checkbox.getAttribute('class')).toContain('focus:ring');
      });
    });

    it('should show checked state for selected values', () => {
      const { container } = render(
        <FacetPanel
          config={mockConfig}
          values={mockValues}
          selectedValues={['Paris']}
        />
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      const firstCheckbox = checkboxes[0] as HTMLInputElement;

      expect(firstCheckbox.checked).toBe(true);
    });
  });
});

describe('Accessibility - Modal Dialogs', () => {
  describe('FacetPanel modal', () => {
    const mockConfig: FieldConfig = {
      field: 'theme',
      label: 'Theme',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };

    // Create more than 10 values to trigger "Show more" button
    const manyValues: FacetValue[] = Array.from({ length: 15 }, (_, i) => ({
      value: `Theme ${i + 1}`,
      count: 100 - i,
    }));

    it('should have proper ARIA attributes for modal', () => {
      const { container } = render(
        <FacetPanel config={mockConfig} values={manyValues} selectedValues={[]} />
      );

      // Click "Show more" button
      const showMoreButton = container.querySelector('button:not([aria-expanded])');
      if (showMoreButton) {
        (showMoreButton as HTMLButtonElement).click();

        // Check modal attributes
        const modal = container.querySelector('[role="dialog"]');
        expect(modal).toBeTruthy();
        expect(modal?.getAttribute('aria-modal')).toBe('true');
        expect(modal?.getAttribute('aria-labelledby')).toBe('facet-modal-title');
      }
    });

    it('should have close button with accessible label', () => {
      const { container } = render(
        <FacetPanel config={mockConfig} values={manyValues} selectedValues={[]} />
      );

      // Click "Show more" button
      const showMoreButton = container.querySelector('button:not([aria-expanded])');
      if (showMoreButton) {
        (showMoreButton as HTMLButtonElement).click();

        const closeButton = container.querySelector('[aria-label="Close modal"]');
        expect(closeButton).toBeTruthy();
      }
    });
  });
});

describe('Accessibility - Focus Management', () => {
  it('should have visible focus indicators on interactive elements', () => {
    const mockConfig: FieldConfig = {
      field: 'access_rights',
      label: 'Access Rights',
      isArray: false,
      facetable: true,
      displayOnCard: true,
      displayOnItem: true,
    };

    const mockValues: FacetValue[] = [
      { value: 'Public', count: 1000 },
      { value: 'Restricted', count: 200 },
    ];

    const { container } = render(
      <FacetPanel config={mockConfig} values={mockValues} selectedValues={[]} />
    );

    // Check that buttons and inputs have focus ring classes
    const button = container.querySelector('button');
    expect(button?.className).toContain('focus:ring');

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      expect(checkbox.className).toContain('focus:ring');
    });
  });
});

describe('Accessibility - Semantic HTML Best Practices', () => {
  it('should use semantic button elements for interactive controls', () => {
    const mockConfig: FieldConfig = {
      field: 'resource_class',
      label: 'Resource Class',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };

    const mockValues: FacetValue[] = [
      { value: 'Maps', count: 5000 },
    ];

    const { container } = render(
      <FacetPanel config={mockConfig} values={mockValues} selectedValues={[]} />
    );

    // Should use button element, not div with onClick
    const expandButton = container.querySelector('button[aria-expanded]');
    expect(expandButton?.tagName).toBe('BUTTON');
  });

  it('should use label elements for form controls', () => {
    const mockConfig: FieldConfig = {
      field: 'provider',
      label: 'Provider',
      isArray: false,
      facetable: true,
      displayOnCard: true,
      displayOnItem: true,
    };

    const mockValues: FacetValue[] = [
      { value: 'Stanford', count: 100 },
    ];

    // Start with selected value so panel is expanded
    const { container } = render(
      <FacetPanel config={mockConfig} values={mockValues} selectedValues={['Stanford']} />
    );

    const labels = container.querySelectorAll('label');
    expect(labels.length).toBeGreaterThan(0);

    labels.forEach((label) => {
      // Each label should contain an input
      const input = label.querySelector('input');
      expect(input).toBeTruthy();
    });
  });
});

describe('Accessibility - Color and Contrast', () => {
  it('should have dark mode support classes', () => {
    const mockConfig: FieldConfig = {
      field: 'theme',
      label: 'Theme',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };

    const mockValues: FacetValue[] = [
      { value: 'Environment', count: 500 },
    ];

    // Start with selected value so panel is expanded and we can check dark mode classes on content
    const { container } = render(
      <FacetPanel config={mockConfig} values={mockValues} selectedValues={['Environment']} />
    );

    // Check for dark mode classes
    const headings = container.querySelectorAll('h2');
    headings.forEach((heading) => {
      expect(heading.className).toMatch(/dark:/);
    });

    // Check span elements for dark mode classes
    const spanElements = container.querySelectorAll('span');
    const hasDarkModeClasses = Array.from(spanElements).some((el) =>
      el.className.includes('dark:')
    );
    expect(hasDarkModeClasses).toBe(true);
  });
});
