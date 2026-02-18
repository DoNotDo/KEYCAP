import { useMemo, useState } from 'react';
import { InventoryItem, MaterialOrder, Order, ConsumptionRecord, User } from '../types';
import { AlertTriangle, ArrowRight, Factory, FileWarning } from 'lucide-react';

interface ExecutiveSummaryProps {
  materialItems: InventoryItem[];
  finishedItems: InventoryItem[];
  materialOrders: MaterialOrder[];
  orders: Order[];
  consumptions: ConsumptionRecord[];
  getBOMByFinishedItem: (itemId: string) => BOMItem[];
  currentUser: User;
}

type RiskLevel = 'low' | 'medium' | 'high';

const currency = (value: number) => `${Math.round(value).toLocaleString()}원`;

export const ExecutiveSummary = ({
  materialItems,
  finishedItems,
  materialOrders,
  orders,
  consumptions,
  getBOMByFinishedItem,
  currentUser,
}: ExecutiveSummaryProps) => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedRiskKey, setSelectedRiskKey] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    averageDays: 30,
    overstockDays: 60,
    leadtimeCoverDays: 7,
  });

  const now = new Date();

  const orderSummary = useMemo(() => {
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
    const backlogOrders = orders.filter(o => o.status === 'pending');
    const shippedOrders = orders.filter(o => o.status === 'shipping' || o.status === 'received');
    return { pendingOrders, backlogOrders, shippedOrders };
  }, [orders]);

  const materialIncomingMap = useMemo(() => {
    const map = new Map<string, number>();
    materialOrders.forEach(order => {
      if (order.status === 'ordered' || order.status === 'partial') {
        const current = map.get(order.materialItemId) || 0;
        map.set(order.materialItemId, current + order.quantity);
      }
    });
    return map;
  }, [materialOrders]);

  const materialRequiredMap = useMemo(() => {
    const map = new Map<string, number>();
    orderSummary.pendingOrders.forEach(order => {
      const bomList = getBOMByFinishedItem(order.finishedItemId);
      bomList.forEach(bom => {
        const current = map.get(bom.materialItemId) || 0;
        map.set(bom.materialItemId, current + bom.quantity * order.quantity);
      });
    });
    return map;
  }, [orderSummary.pendingOrders, getBOMByFinishedItem]);

  const finishedDemandMap = useMemo(() => {
    const map = new Map<string, number>();
    orderSummary.pendingOrders.forEach(order => {
      const current = map.get(order.finishedItemId) || 0;
      map.set(order.finishedItemId, current + order.quantity);
    });
    return map;
  }, [orderSummary.pendingOrders]);

  const finishedAvgDailyOut = useMemo(() => {
    const start = new Date();
    start.setDate(now.getDate() - settings.averageDays);
    const map = new Map<string, number>();
    consumptions
      .filter(cons => cons.itemType === 'finished' && new Date(cons.processedAt) >= start)
      .forEach(cons => {
        const current = map.get(cons.itemId) || 0;
        map.set(cons.itemId, current + cons.quantity);
      });
    return map;
  }, [consumptions, settings.averageDays, now]);

  const pipelineStages = useMemo(() => {
    const procurementQty = materialOrders.filter(o => o.status !== 'received' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.quantity, 0);
    const procurementValue = materialOrders.filter(o => o.status !== 'received' && o.status !== 'cancelled')
      .reduce((sum, o) => {
        const material = materialItems.find(item => item.id === o.materialItemId);
        return sum + (material?.price || 0) * o.quantity;
      }, 0);
    const receivingQty = materialOrders.filter(o => o.status === 'received')
      .reduce((sum, o) => sum + (o.receivedQuantity || o.quantity), 0);
    const wipQty = orderSummary.pendingOrders.reduce((sum, o) => sum + o.quantity, 0);
    const finishedQty = finishedItems.reduce((sum, item) => sum + item.quantity, 0);
    const finishedValue = finishedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const backlogQty = orderSummary.backlogOrders.reduce((sum, o) => sum + o.quantity, 0);

    const delayedPoCount = materialOrders.filter(o => o.expectedDate && new Date(o.expectedDate) < now && (o.receivedQuantity || 0) < o.quantity).length;
    const materialShortageCount = materialItems.filter(item => {
      const incoming = materialIncomingMap.get(item.id) || 0;
      const required = materialRequiredMap.get(item.id) || 0;
      return item.quantity + incoming < required;
    }).length;
    const finishedRiskCount = finishedItems.filter(item => (finishedDemandMap.get(item.id) || 0) > item.quantity).length;

    return [
      { key: 'procurement', label: '부자재 구매', qty: procurementQty, value: procurementValue, risk: delayedPoCount > 0 ? 'high' : 'low' },
      { key: 'receiving', label: '입고', qty: receivingQty, value: 0, risk: delayedPoCount > 0 ? 'medium' : 'low' },
      { key: 'wip', label: 'WIP', qty: wipQty, value: 0, risk: materialShortageCount > 0 ? 'high' : 'low' },
      { key: 'finished', label: '완성재고', qty: finishedQty, value: finishedValue, risk: finishedRiskCount > 0 ? 'medium' : 'low' },
      { key: 'shipping', label: '출고·백오더', qty: backlogQty, value: 0, risk: backlogQty > 0 ? 'medium' : 'low' },
    ];
  }, [materialOrders, materialItems, finishedItems, orderSummary, materialIncomingMap, materialRequiredMap, finishedDemandMap, now]);

  const riskItems = useMemo(() => {
    const items: Array<{
      key: string;
      title: string;
      cause: string;
      impact: string;
      level: RiskLevel;
      sourceId?: string;
    }> = [];

    materialOrders.forEach(order => {
      if (order.expectedDate && new Date(order.expectedDate) < now && (order.receivedQuantity || 0) < order.quantity) {
        const delayDays = Math.ceil((now.getTime() - new Date(order.expectedDate).getTime()) / (1000 * 60 * 60 * 24));
        const material = materialItems.find(item => item.id === order.materialItemId);
        items.push({
          key: 'late-po',
          title: '납기 지연 PO',
          cause: `PO ${order.id} · ${material?.name || '알 수 없음'}`,
          impact: `${delayDays}일 지연 · ${order.quantity}개`,
          level: 'high',
          sourceId: order.id,
        });
      }
    });

    materialItems.forEach(item => {
      const incoming = materialIncomingMap.get(item.id) || 0;
      const required = materialRequiredMap.get(item.id) || 0;
      if (item.quantity + incoming < required) {
        const shortage = required - (item.quantity + incoming);
        items.push({
          key: 'material-stop',
          title: '생산중단 위험 부자재',
          cause: `${item.name} · 필요 ${required}`,
          impact: `부족 ${shortage}개`,
          level: 'high',
          sourceId: item.id,
        });
      }
    });

    finishedItems.forEach(item => {
      const demand = finishedDemandMap.get(item.id) || 0;
      if (demand > item.quantity) {
        items.push({
          key: 'stockout',
          title: '완성재고 품절 위험',
          cause: `SKU ${item.name}`,
          impact: `부족 ${demand - item.quantity}개`,
          level: 'high',
          sourceId: item.id,
        });
      }
    });

    finishedItems.forEach(item => {
      const totalOut = finishedAvgDailyOut.get(item.id) || 0;
      if (totalOut <= 0) return;
      const avgDaily = totalOut / settings.averageDays;
      const days = avgDaily === 0 ? 0 : item.quantity / avgDaily;
      if (days > settings.overstockDays) {
        items.push({
          key: 'overstock',
          title: '과잉 재고',
          cause: `SKU ${item.name}`,
          impact: `${Math.round(days)}일치 재고`,
          level: 'medium',
          sourceId: item.id,
        });
      }
    });

    materialOrders.forEach(order => {
      if (!order.expectedDate || !order.supplier) {
        items.push({
          key: 'missing-cost',
          title: '단가/납기 미확정',
          cause: `PO ${order.id}`,
          impact: `납기/공급처 미정`,
          level: 'medium',
          sourceId: order.id,
        });
      }
    });

    return items.slice(0, 5);
  }, [materialOrders, materialItems, finishedItems, materialIncomingMap, materialRequiredMap, finishedDemandMap, finishedAvgDailyOut, settings.averageDays, settings.overstockDays, now]);

  const materialSummary = useMemo(() => {
    const in7days = new Date();
    in7days.setDate(now.getDate() + 7);
    const upcomingOrders = materialOrders.filter(order => order.expectedDate && new Date(order.expectedDate) <= in7days);
    const delayedOrders = materialOrders.filter(order => order.expectedDate && new Date(order.expectedDate) < now);
    const missingCostOrders = materialOrders.filter(order => !order.expectedDate || !order.supplier);
    const needed = materialRequiredMap;
    const secured = new Map<string, number>();
    materialItems.forEach(item => {
      const incoming = materialIncomingMap.get(item.id) || 0;
      secured.set(item.id, item.quantity + incoming);
    });
    return { upcomingOrders, delayedOrders, missingCostOrders, needed, secured };
  }, [materialOrders, materialItems, materialIncomingMap, materialRequiredMap, now]);

  const finishedSummary = useMemo(() => {
    const stockout = finishedItems.filter(item => (finishedDemandMap.get(item.id) || 0) > item.quantity);
    const overstock = finishedItems.filter(item => {
      const totalOut = finishedAvgDailyOut.get(item.id) || 0;
      if (totalOut <= 0) return false;
      const avgDaily = totalOut / settings.averageDays;
      const days = avgDaily === 0 ? 0 : item.quantity / avgDaily;
      return days > settings.overstockDays;
    });
    const expectedOut = orderSummary.pendingOrders.reduce((sum, o) => sum + o.quantity, 0);
    const available = finishedItems.reduce((sum, item) => sum + item.quantity, 0);
    const shortage = Math.max(0, expectedOut - available);
    return { stockout, overstock, expectedOut, shortage };
  }, [finishedItems, finishedDemandMap, finishedAvgDailyOut, settings.averageDays, settings.overstockDays, orderSummary]);

  const drilldownRows = useMemo(() => {
    const filtered = selectedRiskKey
      ? riskItems.filter(item => item.title === selectedRiskKey)
      : riskItems;
    const rows = filtered.map(item => ({
      type: item.title,
      sku: item.cause,
      doc: item.sourceId || '-',
      due: item.title === '납기 지연 PO' ? '지연' : '-',
      impact: item.impact,
      owner: currentUser.username,
      action: item.level === 'high' ? '즉시 점검' : '확인 필요',
      status: item.level,
    }));
    const urgent = rows.filter(row => row.status === 'high');
    const ongoing = rows.filter(row => row.status !== 'high');
    return { urgent, ongoing };
  }, [riskItems, currentUser.username, selectedRiskKey]);

  const stageDetailList = useMemo(() => {
    switch (selectedStage) {
      case 'procurement':
        return materialOrders.map(order => ({
          title: `PO ${order.id}`,
          meta: `${order.quantity}개 · ${order.supplier || '미정'}`,
        }));
      case 'receiving':
        return materialOrders.filter(order => order.status === 'received').map(order => ({
          title: `PO ${order.id}`,
          meta: `${order.receivedQuantity || order.quantity}개`,
        }));
      case 'wip':
        return orderSummary.pendingOrders.map(order => ({
          title: `생산 ${order.finishedItemId}`,
          meta: `${order.quantity}개`,
        }));
      case 'finished':
        return finishedItems.map(item => ({
          title: item.name,
          meta: `${item.quantity}개`,
        }));
      case 'shipping':
        return orderSummary.backlogOrders.map(order => ({
          title: `주문 ${order.id}`,
          meta: `${order.quantity}개`,
        }));
      default:
        return [];
    }
  }, [selectedStage, materialOrders, orderSummary, finishedItems]);

  return (
    <div className="executive-summary">
      <div className="executive-header">
        <div>
          <h2>Executive Summary</h2>
          <p className="muted">대표님용 핵심 흐름/리스크 요약</p>
        </div>
        <div className="executive-settings">
          <label>
            평균출고 N일
            <input
              type="number"
              value={settings.averageDays}
              onChange={(e) => setSettings(prev => ({ ...prev, averageDays: Number(e.target.value) }))}
            />
          </label>
          <label>
            과잉 기준일
            <input
              type="number"
              value={settings.overstockDays}
              onChange={(e) => setSettings(prev => ({ ...prev, overstockDays: Number(e.target.value) }))}
            />
          </label>
          <label>
            리드타임 커버
            <input
              type="number"
              value={settings.leadtimeCoverDays}
              onChange={(e) => setSettings(prev => ({ ...prev, leadtimeCoverDays: Number(e.target.value) }))}
            />
          </label>
        </div>
      </div>

      <div className="flow-pipeline">
        {pipelineStages.map(stage => (
          <button
            key={stage.key}
            className={`flow-card ${stage.risk}`}
            onClick={() => setSelectedStage(stage.key)}
          >
            <div className="flow-card-title">{stage.label}</div>
            <div className="flow-card-metrics">
              <span>{stage.qty.toLocaleString()}건</span>
              <span>{stage.value ? currency(stage.value) : '-'}</span>
            </div>
            <span className={`risk-indicator ${stage.risk}`} />
          </button>
        ))}
      </div>

      {selectedStage && (
        <div className="flow-drilldown">
          <div className="flow-drilldown-header">
            <h3>{pipelineStages.find(s => s.key === selectedStage)?.label} 드릴다운</h3>
            <button className="btn btn-secondary btn-small" onClick={() => setSelectedStage(null)}>
              닫기
            </button>
          </div>
          {stageDetailList.length === 0 ? (
            <div className="empty-state">표시할 데이터가 없습니다.</div>
          ) : (
            <div className="flow-drilldown-list">
              {stageDetailList.map((item, idx) => (
                <div key={`${item.title}-${idx}`} className="flow-drilldown-item">
                  <span>{item.title}</span>
                  <span>{item.meta}</span>
                  <ArrowRight size={16} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="executive-grid">
        <div className="risk-panel">
          <div className="panel-header">
            <h3>오늘의 리스크 TOP5</h3>
          </div>
          {riskItems.length === 0 ? (
            <div className="empty-state">리스크가 없습니다.</div>
          ) : (
            <div className="risk-list">
              {riskItems.map((risk, index) => (
                <div key={`${risk.title}-${index}`} className={`risk-item ${risk.level}`}>
                  <div>
                    <strong>{risk.title}</strong>
                    <p>{risk.cause} · {risk.impact}</p>
                  </div>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setSelectedRiskKey(risk.title)}
                  >
                    원인 보기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="summary-panel">
          <h3>부자재 요약</h3>
          <div className="summary-lines">
            <div>
              이번주 필요량 vs 확보량
              <span>
                {materialItems.length}종 · 필요 {Array.from(materialSummary.needed.values()).reduce((sum, v) => sum + v, 0).toLocaleString()} /
                확보 {Array.from(materialSummary.secured.values()).reduce((sum, v) => sum + v, 0).toLocaleString()}
              </span>
            </div>
            <div>
              지연 발주/입고
              <span>{materialSummary.delayedOrders.length}건</span>
            </div>
            <div>
              미정 단가/납기
              <span>{materialSummary.missingCostOrders.length}건</span>
            </div>
          </div>
        </div>

        <div className="summary-panel">
          <h3>완성재고 요약</h3>
          <div className="summary-lines">
            <div>
              품절 위험 SKU
              <span>{finishedSummary.stockout.length}건</span>
            </div>
            <div>
              과잉 SKU
              <span>{finishedSummary.overstock.length}건</span>
            </div>
            <div>
              이번주 출고예정 vs 부족
              <span>{finishedSummary.expectedOut.toLocaleString()} / 부족 {finishedSummary.shortage.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="executive-tables">
        <div className="table-panel">
          <h3><AlertTriangle size={16} /> 즉시 조치 필요</h3>
          <div className="executive-table">
            <div className="executive-table-header">
              <span>유형</span>
              <span>품목/SKU</span>
              <span>원인 문서</span>
              <span>영향</span>
              <span>담당</span>
              <span>다음 액션</span>
              <span>상태</span>
            </div>
            {drilldownRows.urgent.length === 0 ? (
              <div className="empty-state">즉시 조치 항목이 없습니다.</div>
            ) : (
              drilldownRows.urgent.map((row, idx) => (
                <div key={`urgent-${idx}`} className="executive-table-row">
                  <span>{row.type}</span>
                  <span>{row.sku}</span>
                  <span>{row.doc}</span>
                  <span>{row.impact}</span>
                  <span>{row.owner}</span>
                  <span>{row.action}</span>
                  <span className="status-chip high">HIGH</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="table-panel">
          <h3><FileWarning size={16} /> 진행 중</h3>
          <div className="executive-table">
            <div className="executive-table-header">
              <span>유형</span>
              <span>품목/SKU</span>
              <span>원인 문서</span>
              <span>영향</span>
              <span>담당</span>
              <span>다음 액션</span>
              <span>상태</span>
            </div>
            {drilldownRows.ongoing.length === 0 ? (
              <div className="empty-state">진행 중 항목이 없습니다.</div>
            ) : (
              drilldownRows.ongoing.map((row, idx) => (
                <div key={`ongoing-${idx}`} className="executive-table-row">
                  <span>{row.type}</span>
                  <span>{row.sku}</span>
                  <span>{row.doc}</span>
                  <span>{row.impact}</span>
                  <span>{row.owner}</span>
                  <span>{row.action}</span>
                  <span className="status-chip medium">MED</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedRiskKey && (
        <div className="risk-highlight">
          <Factory size={18} />
          <span>{selectedRiskKey} 원인 보기로 필터링되었습니다.</span>
          <button className="btn btn-secondary btn-small" onClick={() => setSelectedRiskKey(null)}>
            해제
          </button>
        </div>
      )}
    </div>
  );
};
