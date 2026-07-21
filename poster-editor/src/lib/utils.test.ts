import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles falsy values', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
  })

  it('resolves tailwind conflicts by keeping last', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles empty input', () => {
    expect(cn('')).toBe('')
  })
})
