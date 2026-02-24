import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { MaterialOrder, InventoryItem } from '../types';

interface MaterialOrderTimelineProps {
  materialOrders: MaterialOrder[];
  materialItems: InventoryItem[];
  weeks?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function MaterialOrderTimeline({ materialOrders, materialItems, weeks = 6 }: MaterialOrderTimelineProps) {
  const getMaterialName = (id: string) => materialItems.find(i => i.id === id)?.name || id;

  const { startDate, days, materialRows } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    const end = new Date(today);
    end.setDate(end.getDate() + weeks * 7);
    const startTime = start.getTime();
    const endTime = end.getTime();
    const dayCount = Math.ceil((endTime - startTime) / DAY_MS);
    const days: Date[] = [];
    for (let i = 0; i < dayCount; i++) {
      days.push(new Date(startTime + i * DAY_MS));
    }

    const byMaterial = new Map<string, MaterialOrder[]>();
    materialOrders.forEach(o => {
      if (!byMaterial.has(o.materialItemId)) byMaterial.set(o.materialItemId, []);
      byMaterial.get(o.materialItemId)!.push(o);
    });

    const materialRows = Array.from(byMaterial.entries()).map(([materialId, orders]) => ({
      materialId,
      name: getMaterialName(materialId),
      orders: orders.map(o => {
        const orderD = new Date(o.orderDate).getTime();
        const expectD = o.expectedDate ? new Date(o.expectedDate).getTime() : orderD + 7 * DAY_MS;
        const receivedD = o.receivedAt ? new Date(o.receivedAt).getTime() : null;
        const endD = o.status === 'received' && receivedD ? receivedD : expectD;
        return {
          ...o,
          startTime: Math.max(startTime, orderD),
          endTime: Math.min(endTime, endD),
          isReceived: o.status === 'received',
          isOverdue: o.status !== 'received' && expectD < today.getTime(),
        };
      }),
    }));

    return { startDate: start, days, materialRows };
  }, [materialOrders, materialItems, weeks]);

  const totalDays = days.length;
  const startTime = startDate.getTime();

  return (
    <div className="material-timeline">
      <h3 className="material-timeline-title">부자재 발주 · 입고 타임라인</h3>
      <div className="material-timeline-scroll">
        <div className="material-timeline-grid" style={{ '--cols': totalDays } as CSSProperties}>
          <div className="material-timeline-header">
            <div className="material-timeline-label material-timeline-label-fixed">항목</div>
            <div className="material-timeline-days">
              {days.map((d, i) => (
                <div key={i} className={`material-timeline-day ${i === 7 ? 'today' : ''}`}>
                  <span className="day-num">{d.getDate()}</span>
                  <span className="day-month">{d.getMonth() + 1}/{d.getDate()}</span>
                </div>
              ))}
            </div>
          </div>
          {materialRows.map((row) => (
            <div key={row.materialId} className="material-timeline-row">
              <div className="material-timeline-label material-timeline-label-fixed" title={row.name}>
                {row.name}
              </div>
              <div className="material-timeline-bars">
                {row.orders.map((o) => {
                  const left = ((o.startTime - startTime) / DAY_MS / totalDays) * 100;
                  const width = Math.max(2, ((o.endTime - o.startTime) / DAY_MS / totalDays) * 100);
                  return (
                    <div
                      key={o.id}
                      className={`material-timeline-bar ${o.isReceived ? 'received' : ''} ${o.isOverdue ? 'overdue' : ''}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${o.quantity}개 · ${o.status} ${o.expectedDate ? new Date(o.expectedDate).toLocaleDateString('ko-KR') : ''}`}
                    >
                      <span className="bar-qty">{o.quantity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="material-timeline-legend">
        <span><i className="bar-sample inprogress" /> 진행중</span>
        <span><i className="bar-sample received" /> 입고완료</span>
        <span><i className="bar-sample overdue" /> 지연</span>
      </div>
    </div>
  );
}
