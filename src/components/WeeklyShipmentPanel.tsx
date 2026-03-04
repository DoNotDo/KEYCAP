import { useMemo } from 'react';
import { Transaction, InventoryItem, BOMItem } from '../types';
import { Package, TrendingUp } from 'lucide-react';

function getWeekKey(isoDate: string): string {
  const d = new Date(isoDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  return mon.toISOString().slice(0, 10);
}

function getWeekLabel(weekKey: string): string {
  const mon = new Date(weekKey);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return `${mon.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} ~ ${sun.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`;
}

interface WeeklyShipmentPanelProps {
  transactions: Transaction[];
  items: InventoryItem[];
  bomItems: BOMItem[];
}

export function WeeklyShipmentPanel({ transactions, items, bomItems }: WeeklyShipmentPanelProps) {
  const finishedIds = useMemo(() => new Set(items.filter(i => i.type === 'finished').map(i => i.id)), [items]);

  const weeklyOut = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    transactions
      .filter(tx => tx.type === 'out' && finishedIds.has(tx.itemId))
      .forEach(tx => {
        const week = getWeekKey(tx.timestamp);
        if (!map.has(week)) map.set(week, new Map());
        const row = map.get(week)!;
        row.set(tx.itemId, (row.get(tx.itemId) || 0) + tx.quantity);
      });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a)).slice(0, 8);
  }, [transactions, finishedIds]);

  const weeklyMaterialEstimate = useMemo(() => {
    const result = new Map<string, Map<string, number>>();
    weeklyOut.forEach(([weekKey, finishedQty]) => {
      const matMap = new Map<string, number>();
      finishedQty.forEach((qty, finishedItemId) => {
        bomItems.filter(b => b.finishedItemId === finishedItemId).forEach(b => {
          matMap.set(b.materialItemId, (matMap.get(b.materialItemId) || 0) + b.quantity * qty);
        });
      });
      result.set(weekKey, matMap);
    });
    return result;
  }, [weeklyOut, bomItems]);

  const getItemName = (id: string) => items.find(i => i.id === id)?.name ?? id;

  if (weeklyOut.length === 0) {
    return (
      <div className="weekly-shipment-panel">
        <h2>주간 출고 · 예상 소모량</h2>
        <p className="empty-state">완제품 출고 내역이 없습니다. 출고 발생 시 주차별로 집계됩니다.</p>
      </div>
    );
  }

  return (
    <div className="weekly-shipment-panel">
      <h2>주간 출고 · 예상 소모량</h2>
      <p className="section-desc">회사 내부 출고 기준 주차별 집계입니다. 예상 부자재 소모는 BOM 기준입니다.</p>
      <div className="weekly-shipment-grid">
        {weeklyOut.map(([weekKey, finishedMap]) => (
          <div key={weekKey} className="weekly-shipment-card">
            <h4 className="weekly-shipment-week">{getWeekLabel(weekKey)}</h4>
            <div className="weekly-shipment-section">
              <span className="weekly-shipment-label"><Package size={14} /> 완제품 출고</span>
              <ul>
                {Array.from(finishedMap.entries()).map(([itemId, qty]) => (
                  <li key={itemId}>{getItemName(itemId)} <strong>{qty}개</strong></li>
                ))}
              </ul>
            </div>
            <div className="weekly-shipment-section">
              <span className="weekly-shipment-label"><TrendingUp size={14} /> 예상 부자재 소모</span>
              {(() => {
                const matMap = weeklyMaterialEstimate.get(weekKey);
                if (!matMap || matMap.size === 0) return <p className="empty-inline">-</p>;
                return (
                  <ul>
                    {Array.from(matMap.entries()).map(([matId, qty]) => (
                      <li key={matId}>{getItemName(matId)} <strong>{qty}개</strong></li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
