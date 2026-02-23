/**
 * 주간 재고 보고: 지점·카테고리·품목, 재고 0~10 보고
 */
import { BRANCH_LIST } from './branches';

/** 초기 시드용 지점 10개 (앞 10개 사용, 필요 시 수정) */
export const BETA_BRANCHES = BRANCH_LIST.slice(0, 10);

/** 지점별 직원 로그인 ID (emp1=본사, emp2=평촌, …) */
export const BETA_EMPLOYEE_LOGINS = BETA_BRANCHES.map((branch, i) => ({
  loginId: `emp${i + 1}`,
  branchName: branch,
}));

/** 주차 키 (예: 2026-W08) */
export function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** 재고 수준 최소/최대 */
export const BETA_LEVEL_MIN = 0;
export const BETA_LEVEL_MAX = 10;
