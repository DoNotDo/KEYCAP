import React, { useMemo } from 'react';
import { InventoryItem, Transaction } from '../types';

interface StockCountStatusProps {
  branches: string[];
  items: InventoryItem[];
  transactions: Transaction[];
}

interface BranchStatus {
  branchName: string;
  lastReportDate: string | null;
  daysSinceReport: number | null;
}

export const StockCountStatus: React.FC<StockCountStatusProps> = ({ branches, items, transactions }) => {

  const branchStatus = useMemo((): BranchStatus[] => {
    const itemBranchMap = new Map<string, string>();
    items.forEach(item => { if (item.branchName != null) itemBranchMap.set(item.id, item.branchName); });

    const lastReportMap = new Map<string, string>();

    transactions.forEach(t => {
      if (t.reason === '재고 실사') {
        const branchName = itemBranchMap.get(t.itemId);
        if (branchName) {
          if (!lastReportMap.has(branchName) || new Date(t.timestamp) > new Date(lastReportMap.get(branchName)!)) {
            lastReportMap.set(branchName, t.timestamp);
          }
        }
      }
    });

    return branches.map(branchName => {
      const lastReportDate = lastReportMap.get(branchName) || null;
      let daysSinceReport: number | null = null;
      if (lastReportDate) {
        const diffTime = Math.abs(new Date().getTime() - new Date(lastReportDate).getTime());
        daysSinceReport = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
      return {
        branchName,
        lastReportDate,
        daysSinceReport,
      };
    }).sort((a,b) => {
        if (a.daysSinceReport === null) return 1;
        if (b.daysSinceReport === null) return -1;
        return b.daysSinceReport - a.daysSinceReport;
    });

  }, [branches, items, transactions]);

  return (
    <div className="stock-count-status-container">
      <h2>지점별 재고 보고 현황</h2>
      <p>지점별 마지막 재고 실사 보고 일자입니다. 장기간 보고가 없는 지점은 확인이 필요합니다.</p>
      <div className="status-list">
        <div className="status-list-header">
          <span>지점명</span>
          <span>마지막 보고일</span>
          <span>경과일</span>
        </div>
        {branchStatus.map(status => (
          <div 
            key={status.branchName} 
            className={`status-item ${status.daysSinceReport === null || status.daysSinceReport > 7 ? 'needs-attention' : ''}`}>
            <span>{status.branchName}</span>
            <span>{status.lastReportDate ? new Date(status.lastReportDate).toLocaleDateString('ko-KR') : '보고 내역 없음'}</span>
            <span>{status.daysSinceReport !== null ? `${status.daysSinceReport}일 전` : '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
