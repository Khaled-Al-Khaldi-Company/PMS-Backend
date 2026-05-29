import { BOQItem } from '@prisma/client';

export type BillingMode = 'QUANTITY' | 'LUMP_SUM_PROGRESS';
export type EntryMode = 'QTY' | 'PERCENT' | 'VALUE';

const LUMP_SUM_UNIT_HINTS = [
  'مقطوعية',
  'مقطوع',
  'ls',
  'l.s',
  'lump',
  'job',
  'sum',
  'م.م',
];

export function isLumpSumUnit(unit?: string | null): boolean {
  const normalized = (unit || '').trim().toLowerCase();
  if (!normalized) return false;
  return LUMP_SUM_UNIT_HINTS.some((hint) => normalized.includes(hint));
}

export function resolveBillingMode(
  boqItem: Pick<BOQItem, 'billingMode' | 'unit'>,
): BillingMode {
  if (boqItem.billingMode === 'LUMP_SUM_PROGRESS') return 'LUMP_SUM_PROGRESS';
  if (boqItem.billingMode === 'QUANTITY') return 'QUANTITY';
  return isLumpSumUnit(boqItem.unit) ? 'LUMP_SUM_PROGRESS' : 'QUANTITY';
}

export function inferBillingModeFromUnit(unit?: string): BillingMode {
  return isLumpSumUnit(unit) ? 'LUMP_SUM_PROGRESS' : 'QUANTITY';
}

export interface ExecutionInput {
  boqItemId: string;
  currentQty?: number | string;
  currentPercent?: number | string;
  currentValue?: number | string;
  entryMode?: string;
}

export interface NormalizedExecution {
  currentQty: number;
  entryMode: EntryMode;
  currentProgressPercent?: number;
}

export function normalizeExecutionInput(
  item: ExecutionInput,
  boqItem: Pick<BOQItem, 'billingMode' | 'unit'>,
  invoiceMaxQuantity: number,
  invoiceUnitPrice: number,
): NormalizedExecution {
  const billingMode = resolveBillingMode(boqItem);
  const lineTotal = invoiceMaxQuantity * invoiceUnitPrice;

  if (billingMode === 'LUMP_SUM_PROGRESS') {
    const hasPercent =
      item.currentPercent !== undefined &&
      item.currentPercent !== null &&
      item.currentPercent !== '';
    const hasValue =
      item.currentValue !== undefined &&
      item.currentValue !== null &&
      item.currentValue !== '';

    if (hasPercent && hasValue) {
      throw new Error('لا يمكن إدخال النسبة والقيمة معًا لنفس البند المقطوعية');
    }

    if (hasPercent) {
      const currentProgressPercent = Math.min(
        100,
        Math.max(0, Number(item.currentPercent)),
      );
      const maxFraction = invoiceMaxQuantity > 0 ? invoiceMaxQuantity : 1;
      const currentQty = (currentProgressPercent / 100) * maxFraction;
      return {
        currentQty,
        entryMode: 'PERCENT',
        currentProgressPercent,
      };
    }

    if (hasValue) {
      if (lineTotal <= 0) {
        throw new Error('قيمة العقد للبند المقطوعية غير صالحة');
      }
      const value = Math.max(0, Number(item.currentValue));
      const maxFraction = invoiceMaxQuantity > 0 ? invoiceMaxQuantity : 1;
      const currentQty = (value / lineTotal) * maxFraction;
      const currentProgressPercent = (currentQty / maxFraction) * 100;
      return {
        currentQty,
        entryMode: 'VALUE',
        currentProgressPercent,
      };
    }

    const rawQty = parseFloat(String(item.currentQty ?? 0)) || 0;
    const maxFraction = invoiceMaxQuantity > 0 ? invoiceMaxQuantity : 1;
    let currentQty = rawQty;
    let currentProgressPercent = (currentQty / maxFraction) * 100;

    if (rawQty > maxFraction && rawQty <= 100) {
      currentProgressPercent = rawQty;
      currentQty = (currentProgressPercent / 100) * maxFraction;
    }

    return {
      currentQty,
      entryMode: 'QTY',
      currentProgressPercent,
    };
  }

  return {
    currentQty: parseFloat(String(item.currentQty ?? 0)) || 0,
    entryMode: 'QTY',
  };
}
