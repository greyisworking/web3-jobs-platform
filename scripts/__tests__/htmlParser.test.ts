/**
 * HTML Parser Unit Tests
 *
 * Tests the htmlParser utility functions for:
 * - HTML entity decoding
 * - HTML tag stripping
 * - Combined cleanup
 * - Validation functions
 */
import { describe, test, expect } from 'vitest'
import {
  decodeHtmlEntities,
  stripHtmlTags,
  cleanHtml,
  hasUndecodedEntities,
  hasHtmlTags,
  validateCleanedOutput,
} from '../utils/htmlParser'

describe('decodeHtmlEntities', () => {
  test('decodes common named entities', () => {
    expect(decodeHtmlEntities('&lt;div&gt;')).toBe('<div>')
    expect(decodeHtmlEntities('&amp;')).toBe('&')
    expect(decodeHtmlEntities('&quot;hello&quot;')).toBe('"hello"')
    expect(decodeHtmlEntities('&apos;test&apos;')).toBe("'test'")
    expect(decodeHtmlEntities('&nbsp;')).toBe(' ')
  })

  test('decodes numeric entities', () => {
    expect(decodeHtmlEntities('&#60;')).toBe('<')
    expect(decodeHtmlEntities('&#62;')).toBe('>')
    expect(decodeHtmlEntities('&#38;')).toBe('&')
    expect(decodeHtmlEntities('&#39;')).toBe("'")
  })

  test('decodes hex entities', () => {
    expect(decodeHtmlEntities('&#x3c;')).toBe('<')
    expect(decodeHtmlEntities('&#x3e;')).toBe('>')
    expect(decodeHtmlEntities('&#x26;')).toBe('&')
    expect(decodeHtmlEntities('&#x27;')).toBe("'")
  })

  test('decodes double-encoded entities', () => {
    expect(decodeHtmlEntities('&amp;lt;')).toBe('<')
    expect(decodeHtmlEntities('&amp;gt;')).toBe('>')
    expect(decodeHtmlEntities('&amp;quot;')).toBe('"')
    expect(decodeHtmlEntities('&amp;amp;')).toBe('&')
  })

  test('decodes smart quotes', () => {
    expect(decodeHtmlEntities('&lsquo;test&rsquo;')).toBe("'test'")
    expect(decodeHtmlEntities('&ldquo;test&rdquo;')).toBe('"test"')
    expect(decodeHtmlEntities('&#8216;test&#8217;')).toBe("'test'")
    expect(decodeHtmlEntities('&#8220;test&#8221;')).toBe('"test"')
  })

  test('decodes dashes', () => {
    expect(decodeHtmlEntities('&ndash;')).toBe('–')
    expect(decodeHtmlEntities('&mdash;')).toBe('—')
    expect(decodeHtmlEntities('&#8211;')).toBe('–')
    expect(decodeHtmlEntities('&#8212;')).toBe('—')
  })

  test('handles complex mixed content', () => {
    const input = '&lt;div class=&quot;test&quot;&gt;Hello &amp; World&lt;/div&gt;'
    const expected = '<div class="test">Hello & World</div>'
    expect(decodeHtmlEntities(input)).toBe(expected)
  })

  test('handles double-encoded complex content', () => {
    const input = '&amp;lt;div class=&amp;quot;test&amp;quot;&amp;gt;Hello&amp;lt;/div&amp;gt;'
    const expected = '<div class="test">Hello</div>'
    expect(decodeHtmlEntities(input)).toBe(expected)
  })

  test('handles empty and null-ish input', () => {
    expect(decodeHtmlEntities('')).toBe('')
    expect(decodeHtmlEntities(null as any)).toBe('')
    expect(decodeHtmlEntities(undefined as any)).toBe('')
  })

  test('preserves plain text', () => {
    const text = 'Hello World! This is plain text.'
    expect(decodeHtmlEntities(text)).toBe(text)
  })
})

describe('stripHtmlTags', () => {
  test('removes simple tags', () => {
    expect(stripHtmlTags('<p>Hello</p>')).toBe('Hello')
    expect(stripHtmlTags('<div>Test</div>')).toBe('Test')
    expect(stripHtmlTags('<span>Content</span>')).toBe('Content')
  })

  test('converts br to newline', () => {
    expect(stripHtmlTags('Line 1<br>Line 2')).toBe('Line 1\nLine 2')
    expect(stripHtmlTags('Line 1<br/>Line 2')).toBe('Line 1\nLine 2')
    expect(stripHtmlTags('Line 1<br />Line 2')).toBe('Line 1\nLine 2')
  })

  test('converts headings to markdown', () => {
    expect(stripHtmlTags('<h1>Title</h1>')).toContain('# Title')
    expect(stripHtmlTags('<h2>Subtitle</h2>')).toContain('## Subtitle')
    expect(stripHtmlTags('<h3>Section</h3>')).toContain('### Section')
  })

  test('converts bold/italic to markdown', () => {
    expect(stripHtmlTags('<strong>bold</strong>')).toBe('**bold**')
    expect(stripHtmlTags('<b>bold</b>')).toBe('**bold**')
    expect(stripHtmlTags('<em>italic</em>')).toBe('*italic*')
    expect(stripHtmlTags('<i>italic</i>')).toBe('*italic*')
  })

  test('converts lists to markdown', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
    const result = stripHtmlTags(html)
    expect(result).toContain('- Item 1')
    expect(result).toContain('- Item 2')
  })

  test('converts links to markdown', () => {
    const html = '<a href="https://example.com">Link</a>'
    expect(stripHtmlTags(html)).toBe('[Link](https://example.com)')
  })

  test('removes script and style tags completely', () => {
    const html = '<script>alert("xss")</script>Content<style>.class{}</style>'
    expect(stripHtmlTags(html)).toBe('Content')
  })

  test('removes inline styles and classes', () => {
    const html = '<div style="color: red;" class="test">Content</div>'
    const result = stripHtmlTags(html)
    expect(result).toBe('Content')
    expect(result).not.toContain('style')
    expect(result).not.toContain('class')
  })

  test('handles complex nested HTML', () => {
    const html = `
      <div class="wrapper">
        <h2>Title</h2>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    `
    const result = stripHtmlTags(html)
    expect(result).toContain('## Title')
    expect(result).toContain('**bold**')
    expect(result).toContain('*italic*')
    expect(result).toContain('- Item 1')
  })

  test('handles empty input', () => {
    expect(stripHtmlTags('')).toBe('')
    expect(stripHtmlTags(null as any)).toBe('')
  })
})

describe('cleanHtml', () => {
  test('decodes entities and strips tags', () => {
    const html = '&lt;div class=&quot;test&quot;&gt;Hello &amp; World&lt;/div&gt;'
    const result = cleanHtml(html)
    expect(result).toBe('Hello & World')
    expect(result).not.toContain('&lt;')
    expect(result).not.toContain('&gt;')
    expect(result).not.toContain('<div')
  })

  test('handles double-encoded content', () => {
    const html = '&amp;lt;p&amp;gt;Test&amp;lt;/p&amp;gt;'
    const result = cleanHtml(html)
    expect(result).toBe('Test')
    expect(result).not.toContain('&amp;')
    expect(result).not.toContain('&lt;')
  })

  test('real-world job description example', () => {
    const html = `
      &lt;div class=&quot;content-intro&quot;&gt;
        &lt;p&gt;&lt;strong&gt;About the Role&lt;/strong&gt;&lt;/p&gt;
        &lt;p&gt;We are looking for a developer.&lt;/p&gt;
      &lt;/div&gt;
    `
    const result = cleanHtml(html)
    expect(result).toContain('About the Role')
    expect(result).toContain('We are looking for a developer')
    expect(result).not.toContain('&lt;')
    expect(result).not.toContain('&gt;')
    expect(result).not.toContain('&quot;')
  })
})

describe('hasUndecodedEntities', () => {
  test('returns valid for clean text', () => {
    const result = hasUndecodedEntities('Hello World!')
    expect(result.valid).toBe(true)
    expect(result.entities).toHaveLength(0)
  })

  test('detects common entities', () => {
    expect(hasUndecodedEntities('&lt;div&gt;').valid).toBe(false)
    expect(hasUndecodedEntities('&amp;').valid).toBe(false)
    expect(hasUndecodedEntities('&quot;').valid).toBe(false)
    expect(hasUndecodedEntities('&nbsp;').valid).toBe(false)
  })

  test('detects numeric entities', () => {
    expect(hasUndecodedEntities('&#60;').valid).toBe(false)
    expect(hasUndecodedEntities('&#x3c;').valid).toBe(false)
  })

  test('returns found entities', () => {
    const result = hasUndecodedEntities('Hello &lt;world&gt; &amp; &quot;test&quot;')
    expect(result.valid).toBe(false)
    expect(result.entities).toContain('&lt;')
    expect(result.entities).toContain('&gt;')
    expect(result.entities).toContain('&amp;')
    expect(result.entities).toContain('&quot;')
  })
})

describe('hasHtmlTags', () => {
  test('returns valid for clean text', () => {
    const result = hasHtmlTags('Hello World!')
    expect(result.valid).toBe(true)
    expect(result.tags).toHaveLength(0)
  })

  test('detects HTML tags', () => {
    expect(hasHtmlTags('<div>content</div>').valid).toBe(false)
    expect(hasHtmlTags('<p>paragraph</p>').valid).toBe(false)
    expect(hasHtmlTags('<span class="test">text</span>').valid).toBe(false)
  })

  test('returns found tags', () => {
    const result = hasHtmlTags('<div><p>Content</p></div>')
    expect(result.valid).toBe(false)
    expect(result.tags.length).toBeGreaterThan(0)
  })
})

describe('validateCleanedOutput', () => {
  test('returns valid for clean output', () => {
    const result = validateCleanedOutput('Hello World! This is clean text.')
    expect(result.valid).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  test('detects entities and tags', () => {
    const result = validateCleanedOutput('Hello &lt;div&gt;world<p>test</p>')
    expect(result.valid).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  test('provides detailed issues for entities', () => {
    const result = validateCleanedOutput('Hello &lt;world&gt; &amp; test')
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.includes('entities'))).toBe(true)
  })

  test('provides detailed issues for tags', () => {
    const result = validateCleanedOutput('Content <div>with tags</div>')
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.includes('tags'))).toBe(true)
  })
})
