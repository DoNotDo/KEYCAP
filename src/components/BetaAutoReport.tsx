import { useMemo } from 'react';
import { BetaWeeklyReport, BetaProduct } from '../types';

interface BetaAutoReportProps {
  reports: BetaWeeklyReport[];
  weekKey: string;
  products: BetaProduct[];
}

export function BetaAutoReport({ reports, weekKey, products }: BetaAutoReportProps) {
  const reportsForWeek = useMemo(
    () => reports.filter((r) => r.weekKey === weekKey),
    [reports, weekKey]
  );

  const weeklySalesByProduct = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const sum = reportsForWeek.reduce((s, r) => s + (r.sales?.[p.id] ?? 0), 0);
      map.set(p.id, sum);
    });
    return map;
  }, [reportsForWeek, products]);

  const totalSales = useMemo(() => {
    let s = 0;
    weeklySalesByProduct.forEach((v) => { s += v; });
    return s;
  }, [weeklySalesByProduct]);

  const preferenceRank = useMemo(() => {
    return products
      .map((p) => ({ id: p.id, name: p.name, sales: weeklySalesByProduct.get(p.id) ?? 0 }))
      .sort((a, b) => b.sales - a.sales);
  }, [products, weeklySalesByProduct]);

  return (
    <div className="beta-auto-report">
      <h3>주간 자동 보고서 · {weekKey}</h3>
      <section className="beta-report-block">
        <h4>주간 매출(판매수량 합계)</h4>
        <p className="beta-report-total">총 판매수량: <strong>{totalSales.toLocaleString()}</strong>개</p>
        <p className="beta-report-desc">각 지점에서 입력한 주간 판매수량의 합입니다. 단가를 적용하면 매출액으로 환산할 수 있습니다.</p>
      </section>
      <section className="beta-report-block">
        <h4>제품 선호도 (판매수량 순)</h4>
        <ol className="beta-preference-list">
          {preferenceRank.map(({ id, name, sales }, i) => (
            <li key={id}>
              <span className="rank">{i + 1}</span>
              <span className="name">{name}</span>
              <span className="sales">{sales.toLocaleString()}개</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
