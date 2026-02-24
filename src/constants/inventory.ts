/** 완성재고 '하우징' 카테고리에서 사용하는 분류. 위에서 선택하면 해당 분류만 필터해서 볼 수 있음 */
export const HOUSING_CATEGORY = '하우징';

export const HOUSING_SUBCATEGORIES = [
  '컬러',
  'LED청축/LED갈축/청축/갈축',
  '정사각형4구/직사각형4구/직사각형 2구',
] as const;

export type HousingSubCategory = (typeof HOUSING_SUBCATEGORIES)[number];
