/** 완성재고 '하우징' 카테고리 */
export const HOUSING_CATEGORY = '하우징';

/** 하우징 완성재고 = 컬러 × 스위치 × 형태 (5×4×3 = 60종) */
export const HOUSING_COLORS = ['화이트', '핑크', '퍼플', '블루', '그린'] as const;
export const HOUSING_SWITCHES = ['청축', '갈축', 'LED청축', 'LED갈축'] as const;
export const HOUSING_SHAPES = ['정사각4구', '직사각4구', '직사각2구'] as const;

export type HousingColor = (typeof HOUSING_COLORS)[number];
export type HousingSwitch = (typeof HOUSING_SWITCHES)[number];
export type HousingShape = (typeof HOUSING_SHAPES)[number];

export interface HousingProduct {
  name: string;
  color: HousingColor;
  switch: HousingSwitch;
  shape: HousingShape;
}

/** 컬러 × 스위치 × 형태 곱으로 60종 리스트 생성 */
export function getHousingProductList(): HousingProduct[] {
  const list: HousingProduct[] = [];
  for (const color of HOUSING_COLORS) {
    for (const sw of HOUSING_SWITCHES) {
      for (const shape of HOUSING_SHAPES) {
        list.push({
          name: `${color}-${sw}-${shape}`,
          color,
          switch: sw,
          shape,
        });
      }
    }
  }
  return list;
}

/** 예전 단일 분류 필터용 (호환) - 컬러/스위치/형태 중 하나로 필터할 때 사용 */
export const HOUSING_SUBCATEGORIES = [
  ...HOUSING_COLORS,
  ...HOUSING_SWITCHES,
  ...HOUSING_SHAPES,
] as const;

export type HousingSubCategory = (typeof HOUSING_SUBCATEGORIES)[number];

/** 하우징 BOM용 부자재 카테고리 */
export const HOUSING_MATERIAL_CATEGORY = '하우징 부자재';

/** 형태별 스위치 개수 (완성품 1개당) */
export const HOUSING_SHAPE_SWITCH_QUANTITY: Record<HousingShape, number> = {
  '정사각4구': 4,
  '직사각4구': 4,
  '직사각2구': 2,
};

/** 케이스 부자재 이름 (컬러별) */
export function getHousingCaseMaterialName(color: HousingColor): string {
  return `케이스-${color}`;
}

/** 스위치 부자재 이름 (스위치 타입별) */
export function getHousingSwitchMaterialName(sw: HousingSwitch): string {
  return `스위치-${sw}`;
}

/** BOM 시드용 부자재 ID 접두사 (케이스/스위치 이름 → id) */
const HOUSING_MAT_ID_PREFIX = 'housing-mat-';
export function getHousingCaseMaterialId(color: HousingColor): string {
  const map: Record<HousingColor, string> = { 화이트: 'white', 핑크: 'pink', 퍼플: 'purple', 블루: 'blue', 그린: 'green' };
  return HOUSING_MAT_ID_PREFIX + 'case-' + map[color];
}
export function getHousingSwitchMaterialId(sw: HousingSwitch): string {
  const map: Record<HousingSwitch, string> = { 청축: 'chung', 갈축: 'gal', LED청축: 'ledchung', LED갈축: 'ledgal' };
  return HOUSING_MAT_ID_PREFIX + 'switch-' + map[sw];
}
