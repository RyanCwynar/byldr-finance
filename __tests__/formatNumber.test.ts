import { test, expect } from 'bun:test';
import { formatNumber } from '../lib/formatters';

test('formats small numbers using scientific notation', () => {
  expect(formatNumber(0.005)).toBe('5.00e-3');
});

test('formats thousands with K suffix', () => {
  expect(formatNumber(1234)).toBe('1.23K');
});

test('formats millions with M suffix', () => {
  expect(formatNumber(2500000)).toBe('2.50M');
});

test('uses default formatting for ordinary numbers', () => {
  expect(formatNumber(42)).toBe('42');
});
