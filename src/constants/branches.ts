/**
 * 와펜·키캡 재고 보고용 지점 목록 (카톡 그룹 기준)
 * 재고 등록 시 지점 선택, 지점별 재고 보고, 출고 체크리스트에서 사용
 */
export const BRANCH_LIST = [
  '본사',
  '평촌',
  '천안',
  '마곡',
  '영등포',
  '일산',
  '가든',
  '청량리',
  '건대',
  '목동',
  '판교',
  '광교',
  '강남',
  '수원',
  '동탄',
  '부산 서면',
  '부산 센텀',
  '울산',
] as const;

export type BranchId = (typeof BRANCH_LIST)[number];

/** 지점 표시명 (보고서/카톡에 쓸 때) - 필요 시 매핑 확장 */
export function getBranchDisplayName(branchName: string): string {
  return branchName;
}
