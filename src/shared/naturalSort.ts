const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function compareNatural(a: string, b: string): number {
  return collator.compare(a, b);
}
