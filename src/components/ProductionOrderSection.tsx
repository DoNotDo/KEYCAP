import { useMemo, useState } from 'react';
import {
  InventoryItem,
  BOMItem,
  MaterialOrder,
  BetaProduct,
  BetaCategory,
  BetaWeeklyReport,
  ProductionPlanItem,
  MaterialRequirement,
  OrderRequestItem,
} from '../types';

interface ProductionOrderSectionProps {
  weekKey: string;
  reports: BetaWeeklyReport[];
  products: BetaProduct[];
  categories: BetaCategory[];
  items: InventoryItem[];
  bomItems: BOMItem[];
  onAddMaterialOrder: (order: Omit<MaterialOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export function ProductionOrderSection({
  weekKey,
  reports,
  products,
  categories,
  items,
  bomItems,
  onAddMaterialOrder,
}: ProductionOrderSectionProps) {
  const [created, setCreated] = useState(false);

  const reportsForWeek = useMemo(() => reports.filter(r => r.weekKey === weekKey), [reports, weekKey]);
  const finishedItems = useMemo(() => items.filter(i => i.type === 'finished'), [items]);
  const materialItems = useMemo(() => items.filter(i => i.type === 'material'), [items]);

  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name ?? catId;

  const productionPlan = useMemo((): ProductionPlanItem[] => {
    const plan: ProductionPlanItem[] = [];
    products.forEach(p => {
      const demand = reportsForWeek.reduce((sum, r) => sum + (r.sales?.[p.id] ?? r.levels?.[p.id] ?? 0), 0);
      const finishedStock = finishedItems
        .filter(i => i.betaProductId === p.id)
        .reduce((sum, i) => sum + i.quantity, 0);
      const productionQty = Math.max(0, demand - finishedStock);
      const finishedItem = finishedItems.find(i => i.betaProductId === p.id);
      plan.push({
        productId: p.id,
        productName: p.name,
        categoryName: getCategoryName(p.categoryId),
        demand,
        finishedStock,
        productionQty,
        finishedItemId: finishedItem?.id,
      });
    });
    return plan;
  }, [reportsForWeek, products, finishedItems, categories]);

  const materialRequirements = useMemo((): MaterialRequirement[] => {
    const required = new Map<string, number>();
    productionPlan.forEach(plan => {
      if (plan.productionQty <= 0 || !plan.finishedItemId) return;
      const boms = bomItems.filter(b => b.finishedItemId === plan.finishedItemId);
      boms.forEach(b => {
        const q = (required.get(b.materialItemId) ?? 0) + plan.productionQty * b.quantity;
        required.set(b.materialItemId, q);
      });
    });
    return Array.from(required.entries()).map(([materialItemId, requiredQty]) => {
      const currentStock = materialItems.find(i => i.id === materialItemId)?.quantity ?? 0;
      const shortage = Math.max(0, requiredQty - currentStock);
      return {
        materialItemId,
        materialName: materialItems.find(i => i.id === materialItemId)?.name ?? materialItemId,
        requiredQty,
        currentStock,
        shortage,
      };
    });
  }, [productionPlan, bomItems, materialItems]);

  const orderRequestItems = useMemo((): OrderRequestItem[] => {
    return materialRequirements
      .filter(m => m.shortage > 0)
      .map(m => ({ materialItemId: m.materialItemId, materialName: m.materialName, quantity: m.shortage, reason: '생산계획 반영' }));
  }, [materialRequirements]);

  const handleCreateOrderRequest = async () => {
    const categoryMap = new Map<string, string>();
    materialItems.forEach(i => { if (i.category) categoryMap.set(i.id, i.category); });
    for (const req of orderRequestItems) {
      const orderPayload: Omit<MaterialOrder, 'id' | 'createdAt' | 'updatedAt'> = {
        materialItemId: req.materialItemId,
        category: categoryMap.get(req.materialItemId) ?? '기타',
        quantity: req.quantity,
        status: 'planned',
        orderDate: new Date().toISOString().slice(0, 10),
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        notes: req.reason ?? '생산계획 자동',
      };
      await onAddMaterialOrder(orderPayload);
    }
    setCreated(true);
  };

  return (
    <div className="production-order-section">
      <h3>생산 계획 · 부자재 소요 · 발주요청</h3>
      <p className="production-order-desc">주간보고 수요 − 완성재고 = 생산개수 → BOM 기반 부자재 소요 → 발주요청서 생성</p>

      <section className="production-plan-block">
        <h4>생산 계획 ({weekKey})</h4>
        <div className="production-plan-table-wrap">
          <table className="production-plan-table">
            <thead>
              <tr>
                <th>카테고리</th>
                <th>품목</th>
                <th>수요(주간보고)</th>
                <th>완성재고</th>
                <th>생산개수</th>
              </tr>
            </thead>
            <tbody>
              {productionPlan.map(p => (
                <tr key={p.productId}>
                  <td>{p.categoryName}</td>
                  <td>{p.productName}</td>
                  <td>{p.demand}</td>
                  <td>{p.finishedStock}</td>
                  <td><strong>{p.productionQty}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="production-plan-block">
        <h4>부자재 소요량 (자동 산출)</h4>
        <div className="production-plan-table-wrap">
          <table className="production-plan-table">
            <thead>
              <tr>
                <th>부자재</th>
                <th>소요량</th>
                <th>현재 재고</th>
                <th>부족량</th>
              </tr>
            </thead>
            <tbody>
              {materialRequirements.length === 0 ? (
                <tr><td colSpan={4}>BOM 설정이 있거나 생산계획이 있는 품목이 없습니다.</td></tr>
              ) : (
                materialRequirements.map(m => (
                  <tr key={m.materialItemId}>
                    <td>{m.materialName}</td>
                    <td>{m.requiredQty}</td>
                    <td>{m.currentStock}</td>
                    <td>{m.shortage > 0 ? <strong className="shortage">{m.shortage}</strong> : 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="production-plan-block">
        <h4>발주요청서</h4>
        {orderRequestItems.length === 0 ? (
          <p className="empty-state">부족한 부자재가 없거나 생산계획/BOM이 없습니다.</p>
        ) : (
          <>
            <ul className="order-request-list">
              {orderRequestItems.map(r => (
                <li key={r.materialItemId}>{r.materialName}: <strong>{r.quantity}개</strong></li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateOrderRequest}
              disabled={created}
            >
              {created ? '발주 요청 생성됨' : '발주요청서로 생성'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
