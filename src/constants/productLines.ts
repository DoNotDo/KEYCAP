/**
 * 상품 라인 (상단 탭): 전체 + 하우징/와펜/스트랩/네임택/MD상품/키캡
 * 각 라인별로 동일 UI(재고, BOM, 발주) 복제·필터 적용
 */
export const PRODUCT_LINE_ALL = '전체';
export const PRODUCT_LINES = [
  '하우징',
  '와펜',
  '스트랩',
  '네임택',
  'MD상품',
  '키캡',
] as const;

export type ProductLineId = (typeof PRODUCT_LINES)[number];

export function getProductLineLabel(id: string): string {
  return id === PRODUCT_LINE_ALL ? '전체' : id;
}
