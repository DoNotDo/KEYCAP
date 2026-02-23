import { useMemo, useState } from 'react';
import { BetaWeeklyReport, BetaProduct, BetaCategory } from '../types';

interface BetaAdminDashboardProps {
  reports: BetaWeeklyReport[];
  weekKey: string;
  branchNames: string[];
  products: BetaProduct[];
  categories: BetaCategory[];
  productsByCategory: Map<string, BetaProduct[]>;
}

export function BetaAdminDashboard({ reports, weekKey, branchNames, products, categories, productsByCategory }: BetaAdminDashboardProps) {
  const [view, setView] = useState<'by-branch' | 'by-product' | 'summary'>('by-branch');

  const reportsForWeek = useMemo(
    () => reports.filter((r) => r.weekKey === weekKey),
    [reports, weekKey]
  );

  const byBranch = useMemo(() => {
    const map = new Map<string, BetaWeeklyReport>();
    reportsForWeek.forEach((r) => map.set(r.branchName, r));
    return map;
  }, [reportsForWeek]);

  const byProductLevel = useMemo(() => {
    const map = new Map<string, { total: number; count: number; branches: string[] }>();
    products.forEach((p) => {
      let total = 0;
      const branches: string[] = [];
      reportsForWeek.forEach((r) => {
        const level = r.levels?.[p.id] ?? 0;
        total += level;
        if (level > 0) branches.push(r.branchName);
      });
      map.set(p.id, { total, count: reportsForWeek.length, branches });
    });
    return map;
  }, [reportsForWeek, products]);

  const byProductSales = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const sum = reportsForWeek.reduce((s, r) => s + (r.sales?.[p.id] ?? 0), 0);
      map.set(p.id, sum);
    });
    return map;
  }, [reportsForWeek, products]);

  const productionHint = useMemo(() => {
    const low: string[] = [];
    products.forEach((p) => {
      const info = byProductLevel.get(p.id);
      if (!info) return;
      const avg = info.count ? info.total / info.count : 0;
      if (avg < 3) low.push(p.name);
    });
    return low;
  }, [byProductLevel, products]);

  return (
    <div className="beta-admin-dashboard">
      <h3>주간 현황 · {weekKey}</h3>
      <div className="beta-admin-tabs">
        <button type="button" className={view === 'by-branch' ? 'active' : ''} onClick={() => setView('by-branch')}>지점별 재고</button>
        <button type="button" className={view === 'by-product' ? 'active' : ''} onClick={() => setView('by-product')}>품목별 수량</button>
        <button type="button" className={view === 'summary' ? 'active' : ''} onClick={() => setView('summary')}>생산·출고 요약</button>
      </div>

      {view === 'by-branch' && (
        <div className="beta-table-section beta-dashboard-table-wrap">
          <table className="beta-report-table">
            <thead>
              <tr>
                <th>지점</th>
                {products.map((p) => (
                  <th key={p.id} title={p.name}>{p.name.length > 6 ? p.name.slice(0, 5) + '…' : p.name}</th>
                ))}
                <th>보고일시</th>
              </tr>
            </thead>
            <tbody>
              {branchNames.map((b) => {
                const r = byBranch.get(b);
                return (
                  <tr key={b}>
                    <td>{b}</td>
                    {products.map((p) => (
                      <td key={p.id}>{r?.levels?.[p.id] ?? '-'}</td>
                    ))}
                    <td>{r?.reportedAt ? new Date(r.reportedAt).toLocaleString('ko-KR') : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'by-product' && (
        <div className="beta-table-section beta-dashboard-table-wrap">
          <table className="beta-report-table">
            <thead>
              <tr>
                <th>카테고리</th>
                <th>품목</th>
                <th>재고 합계</th>
                <th>평균</th>
                <th>보고 수</th>
                <th>판매 합계</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const list = productsByCategory.get(cat.id) || [];
                return list.map((p) => {
                  const info = byProductLevel.get(p.id);
                  const salesSum = byProductSales.get(p.id) ?? 0;
                  const avg = info?.count ? (info.total / info.count).toFixed(1) : '-';
                  return (
                    <tr key={p.id}>
                      <td>{cat.name}</td>
                      <td>{p.name}</td>
                      <td>{info?.total ?? 0}</td>
                      <td>{avg}</td>
                      <td>{reportsForWeek.length}</td>
                      <td>{salesSum}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'summary' && (
        <div className="beta-summary-section">
          <h4>생산·출고 참고</h4>
          <p>평균 재고 수준이 낮은 품목(추가 생산 검토):</p>
          <ul>
            {productionHint.length ? productionHint.map((name) => <li key={name}>{name}</li>) : <li>전 구간 양호</li>}
          </ul>
          <p>품목별 주간 판매 합계는 위 &quot;품목별 수량&quot; 탭에서 확인하세요.</p>
        </div>
      )}
    </div>
  );
}
