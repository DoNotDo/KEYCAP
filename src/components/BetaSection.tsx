import { useState, useMemo, useEffect } from 'react';
import { TabNavigation } from './TabNavigation';
import { BetaReportForm } from './BetaReportForm';
import { BetaAdminDashboard } from './BetaAdminDashboard';
import { BetaBranchManage } from './BetaBranchManage';
import { ProductionOrderSection } from './ProductionOrderSection';
import { useBetaReports } from '../hooks/useBetaReports';
import { useBetaConfig } from '../hooks/useBetaConfig';
import { getWeekKey } from '../constants/beta';
import { storage } from '../utils/storage';
import { StockCountStatus } from './StockCountStatus';
import { FileText, LayoutDashboard, MapPin, ClipboardList, CheckSquare } from 'lucide-react';
import { InventoryItem, BOMItem, MaterialOrder, Transaction } from '../types';
import type { BetaCategory, BetaProduct } from '../types';

interface BetaSectionProps {
  isAdmin: boolean;
  branchName: string | undefined;
  reportedBy?: string;
  items?: InventoryItem[];
  bomItems?: BOMItem[];
  transactions?: Transaction[];
  onAddMaterialOrder?: (order: Omit<MaterialOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export function BetaSection({ isAdmin, branchName, reportedBy, items = [], bomItems = [], transactions = [], onAddMaterialOrder }: BetaSectionProps) {
  const { reports, loading: reportsLoading, saveReport, getReportForBranchAndWeek, currentWeekKey } = useBetaReports();
  const { branches, branchNames, loading: configLoading } = useBetaConfig();
  const finishedItems = useMemo(() => items.filter((i) => i.type === 'finished'), [items]);
  const categories = useMemo((): BetaCategory[] => {
    const set = new Set(finishedItems.map((i) => i.category).filter(Boolean));
    return Array.from(set).sort().map((name, idx) => ({ id: name, name, order: idx }));
  }, [finishedItems]);
  const products = useMemo((): BetaProduct[] => {
    return finishedItems.map((i) => ({ id: i.id, name: i.name, categoryId: i.category, order: 0 }));
  }, [finishedItems]);
  const productsByCategory = useMemo(() => {
    const map = new Map<string, BetaProduct[]>();
    finishedItems.forEach((i) => {
      const cat = i.category || '미분류';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push({ id: i.id, name: i.name, categoryId: i.category, order: 0 });
    });
    return map;
  }, [finishedItems]);
  const [weekKey, setWeekKey] = useState(currentWeekKey);
  const BETA_TAB_IDS = ['report', 'dashboard', 'report-status', 'production', 'branches'] as const;
  type BetaTabId = (typeof BETA_TAB_IDS)[number];
  const [betaTab, setBetaTab] = useState<BetaTabId>('report');
  const handleTabChange = (id: string) => {
    if ((BETA_TAB_IDS as readonly string[]).includes(id)) setBetaTab(id as BetaTabId);
  };
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [seeding, setSeeding] = useState(false);

  const loading = reportsLoading || configLoading;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const weekOptions = useMemo(() => {
    const opts: string[] = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
      opts.push(getWeekKey(d));
      d.setDate(d.getDate() - 7);
    }
    return opts;
  }, []);

  const existingReport = branchName ? getReportForBranchAndWeek(branchName, weekKey) : null;

  const tabs = useMemo(() => {
    const t = [
      { id: 'report' as const, label: '보고하기', icon: <FileText size={18} /> },
      ...(isAdmin ? [
        { id: 'dashboard' as const, label: '현황', icon: <LayoutDashboard size={18} /> },
        { id: 'report-status' as const, label: '보고 현황', icon: <CheckSquare size={18} /> },
        { id: 'production' as const, label: '생산·발주', icon: <ClipboardList size={18} /> },
        { id: 'branches' as const, label: '지점 설정', icon: <MapPin size={18} /> },
      ] : []),
    ];
    return t;
  }, [isAdmin]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await storage.seedBetaReportsForWeek(weekKey);
      setToast({ message: '샘플 보고 데이터가 생성되었습니다.' });
    } catch (e) {
      setToast({ message: '생성 중 오류가 발생했습니다.' });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return <div className="main-content"><p>로딩 중…</p></div>;
  }

  return (
    <div className="main-content beta-section weekly-report-section">
      {toast && (
        <div className="beta-toast" role="status">
          {toast.message}
        </div>
      )}
      <div className="section-header weekly-report-header">
        <div className="weekly-report-title-block">
          <h2 className="weekly-report-title">주간 재고 보고</h2>
          <p className="weekly-report-subtitle">지점별 재고 수준과 판매량을 주차 단위로 보고·확인합니다.</p>
        </div>
        <div className="beta-section-header-actions">
          <div className="beta-week-select">
            <label>주차</label>
            <select value={weekKey} onChange={(e) => setWeekKey(e.target.value)}>
              {weekOptions.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <button type="button" className="btn btn-secondary beta-seed-btn" onClick={handleSeed} disabled={seeding}>
              {seeding ? '생성 중…' : '테스트 데이터'}
            </button>
          )}
        </div>
      </div>
      <TabNavigation tabs={tabs} activeTab={betaTab} onTabChange={handleTabChange} />
      <div className="weekly-report-tab-content">
      {betaTab === 'report' && (
        <>
          {branchName ? (
            <>
              {existingReport && (
                <p className="beta-report-meta">마지막 보고: {new Date(existingReport.reportedAt).toLocaleString('ko-KR')}</p>
              )}
              <BetaReportForm
                branchName={branchName}
                initialReport={existingReport}
                weekKey={weekKey}
                categories={categories}
                productsByCategory={productsByCategory}
                onSave={saveReport}
                onSaved={(msg) => setToast({ message: msg })}
                reportedBy={reportedBy}
              />
            </>
          ) : (
            <p className="empty-state">지점으로 로그인하면 주간 재고 보고를 제출할 수 있습니다.</p>
          )}
        </>
      )}
      {betaTab === 'dashboard' && isAdmin && (
        <BetaAdminDashboard
          reports={reports}
          weekKey={weekKey}
          branchNames={branchNames}
          products={products}
          categories={categories}
          productsByCategory={productsByCategory}
        />
      )}
      {betaTab === 'report-status' && isAdmin && (
        <StockCountStatus branches={branchNames} items={items} transactions={transactions} />
      )}
      {betaTab === 'production' && isAdmin && onAddMaterialOrder && (
        <ProductionOrderSection
          weekKey={weekKey}
          reports={reports}
          products={products}
          categories={categories}
          items={items}
          bomItems={bomItems}
          onAddMaterialOrder={onAddMaterialOrder}
        />
      )}
      {betaTab === 'branches' && isAdmin && <BetaBranchManage branches={branches} />}
      </div>
    </div>
  );
}
