import { useMemo, useState } from 'react';
import { MaterialOrder, InventoryItem } from '../types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface OrderVendorsAndScheduleProps {
  materialOrders: MaterialOrder[];
  materialItems: InventoryItem[];
}

export function OrderVendorsAndSchedule({ materialOrders, materialItems }: OrderVendorsAndScheduleProps) {
  const [view, setView] = useState<'by-category' | 'by-schedule'>('by-category');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const getMaterialName = (id: string) => materialItems.find((i) => i.id === id)?.name ?? id;

  const byCategory = useMemo(() => {
    const map = new Map<string, { suppliers: Set<string>; orders: MaterialOrder[] }>();
    materialOrders.forEach((o) => {
      const cat = o.category || '미분류';
      if (!map.has(cat)) map.set(cat, { suppliers: new Set(), orders: [] });
      const entry = map.get(cat)!;
      entry.orders.push(o);
      if (o.supplier) entry.suppliers.add(o.supplier);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [materialOrders]);

  const scheduleList = useMemo(() => {
    return [...materialOrders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [materialOrders]);

  return (
    <div className="order-vendors-schedule">
      <div className="section-header">
        <h2>카테고리별 업체 · 부자재별 입고일정</h2>
      </div>
      <div className="view-tabs">
        <button type="button" className={view === 'by-category' ? 'active' : ''} onClick={() => setView('by-category')}>
          카테고리별 업체·담당 부자재
        </button>
        <button type="button" className={view === 'by-schedule' ? 'active' : ''} onClick={() => setView('by-schedule')}>
          부자재별 입고 일정
        </button>
      </div>

      {view === 'by-category' && (
        <div className="vendor-by-category">
          <p className="section-desc">각 카테고리별 발주에 등록된 업체(supplier)와 해당 부자재입니다. 발주 내역에서 업체를 지정할 수 있습니다.</p>
          {byCategory.map(([category, { suppliers, orders }]) => {
            const isExpanded = expandedCategory === category;
            const materialIds = Array.from(new Set(orders.map((o) => o.materialItemId)));
            const materialsInCategory = materialIds.map((id) => ({ id, name: getMaterialName(id), orderCount: orders.filter((o) => o.materialItemId === id).length }));
            return (
              <div key={category} className="vendor-category-block">
                <button type="button" className="vendor-category-header" onClick={() => setExpandedCategory(isExpanded ? null : category)}>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <span>{category}</span>
                  <span className="badge">업체 {suppliers.size} · 부자재 {materialsInCategory.length}</span>
                </button>
                {isExpanded && (
                  <div className="vendor-category-body">
                    <div className="vendor-list">
                      <h4>등록된 업체</h4>
                      {suppliers.size === 0 ? <p className="empty-inline">발주 시 업체를 지정하면 여기에 표시됩니다.</p> : <ul>{Array.from(suppliers).map((s) => <li key={s}>{s}</li>)}</ul>}
                    </div>
                    <div className="materials-list">
                      <h4>담당 부자재 (발주 건수)</h4>
                      <ul>
                        {materialsInCategory.map(({ id, name, orderCount }) => (
                          <li key={id}><span className="name">{name}</span> <span className="count">{orderCount}건</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {byCategory.length === 0 && <p className="empty-state">발주 내역이 없습니다. 부자재 발주 내역에서 발주를 추가하면 카테고리별로 묶여 표시됩니다.</p>}
        </div>
      )}

      {view === 'by-schedule' && (
        <div className="schedule-view">
          <p className="section-desc">부자재별 발주·입고예정·입고일을 확인할 수 있습니다.</p>
          <div className="table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>부자재</th>
                  <th>카테고리</th>
                  <th>업체</th>
                  <th>수량</th>
                  <th>발주일</th>
                  <th>입고예정</th>
                  <th>입고일</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {scheduleList.map((o) => (
                  <tr key={o.id}>
                    <td>{getMaterialName(o.materialItemId)}</td>
                    <td>{o.category}</td>
                    <td>{o.supplier ?? '-'}</td>
                    <td>{o.quantity}</td>
                    <td>{o.orderDate}</td>
                    <td>{o.expectedDate ?? '-'}</td>
                    <td>{o.receivedAt ?? '-'}</td>
                    <td><span className={`status-badge ${o.status}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {scheduleList.length === 0 && <p className="empty-state">입고 일정이 없습니다.</p>}
        </div>
      )}
    </div>
  );
}
