/**
 * Format a number to be more readable
 * - For small numbers (< 0.01), use scientific notation
 * - For large numbers, use abbreviations (K, M, B)
 * - Otherwise, use toLocaleString with appropriate precision
 */
export function formatNumber(num: number): string {
  // Handle very small numbers with scientific notation
  if (Math.abs(num) > 0 && Math.abs(num) < 0.01) {
    return num.toExponential(2);
  }
  
  // Handle large numbers with abbreviations
  if (Math.abs(num) >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  }
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  
  // For numbers with many decimal places, limit to 6 decimal places
  if (Math.abs(num) < 1 && num.toString().length > 8) {
    return num.toFixed(6);
  }
  
  // Otherwise use regular formatting
  return num.toLocaleString();
} 