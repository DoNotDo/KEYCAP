import { useState, useEffect, FormEvent } from 'react';
import { BetaWeeklyReport } from '../types';
import { BetaCategory, BetaProduct } from '../types';
import { BETA_LEVEL_MIN, BETA_LEVEL_MAX } from '../constants/beta';

interface BetaReportFormProps {
  branchName: string;
  initialReport?: BetaWeeklyReport | null;
  weekKey: string;
  categories: BetaCategory[];
  productsByCategory: Map<string, BetaProduct[]>;
  onSave: (report: BetaWeeklyReport) => Promise<void>;
  onSaved?: (message: string) => void;
  reportedBy?: string;
}

export function BetaReportForm({
  branchName,
  initialReport,
  weekKey,
  categories,
  productsByCategory,
  onSave,
  onSaved,
  reportedBy,
}: BetaReportFormProps) {
  const allProductIds = Array.from(productsByCategory.values()).flat().map(p => p.id);
  const [levels, setLevels] = useState<Record<string, number>>(() => {
    const o: Record<string, number> = {};
    allProductIds.forEach(id => { o[id] = BETA_LEVEL_MIN; });
    return o;
  });
  const [sales, setSales] = useState<Record<string, number>>(() => {
    const o: Record<string, number> = {};
    allProductIds.forEach(id => { o[id] = 0; });
    return o;
  });
  const [saving, setSaving] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(categories[0]?.id ?? null);

  useEffect(() => {
    const nextLevels: Record<string, number> = {};
    const nextSales: Record<string, number> = {};
    allProductIds.forEach(id => {
      nextLevels[id] = initialReport?.levels?.[id] ?? BETA_LEVEL_MIN;
      nextSales[id] = initialReport?.sales?.[id] ?? 0;
    });
    setLevels(nextLevels);
    setSales(nextSales);
  }, [initialReport?.id, initialReport?.reportedAt, categories.length, productsByCategory.size]);

  const setLevel = (productId: string, value: number) => {
    const n = Math.max(BETA_LEVEL_MIN, Math.min(BETA_LEVEL_MAX, Number(value) || 0));
    setLevels((prev) => ({ ...prev, [productId]: n }));
  };

  const setSale = (productId: string, value: number) => {
    const n = Math.max(0, Number(value) || 0);
    setSales((prev) => ({ ...prev, [productId]: n }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const levelsAll: Record<string, number> = {};
      const salesAll: Record<string, number> = {};
      allProductIds.forEach(id => {
        levelsAll[id] = levels[id] ?? BETA_LEVEL_MIN;
        salesAll[id] = sales[id] ?? 0;
      });
      const report: BetaWeeklyReport = {
        id: `${branchName}_${weekKey}`,
        branchName,
        weekKey,
        levels: levelsAll,
        sales: salesAll,
        reportedAt: new Date().toISOString(),
        reportedBy,
      };
      await onSave(report);
      onSaved?.(initialReport ? '수정되었습니다.' : '저장되었습니다.');
    } catch (err) {
      console.error(err);
      onSaved?.('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const levelButtons = Array.from({ length: BETA_LEVEL_MAX - BETA_LEVEL_MIN + 1 }, (_, i) => BETA_LEVEL_MIN + i);

  if (categories.length === 0) {
    return <p className="empty-state">품목이 없습니다. 관리자에게 문의하세요.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="beta-report-form beta-report-form--mobile">
      <p className="beta-report-desc">카테고리를 열고, 품목별 재고 수준(0~10)을 탭하여 선택하세요. 판매수량은 선택 입력입니다.</p>
      <div className="beta-report-cards">
        {categories.map((cat) => {
          const list = productsByCategory.get(cat.id) || [];
          const isOpen = openCategory === cat.id;
          return (
            <div key={cat.id} className="beta-category-card">
              <button
                type="button"
                className="beta-category-card-header"
                onClick={() => setOpenCategory(isOpen ? null : cat.id)}
              >
                <span className="beta-category-card-title">{cat.name}</span>
                <span className="beta-category-card-count">({list.length})</span>
              </button>
              {isOpen && (
                <div className="beta-category-card-body">
                  {list.map((p) => (
                    <div key={p.id} className="beta-report-card">
                      <div className="beta-report-card-title">{p.name}</div>
                      <div className="beta-level-row">
                        <span className="beta-level-label">재고</span>
                        <div className="beta-level-btns" role="group">
                          {levelButtons.map((n) => (
                            <button
                              key={n}
                              type="button"
                              className={`beta-level-btn ${(levels[p.id] ?? 0) === n ? 'active' : ''}`}
                              onClick={() => setLevel(p.id, n)}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="beta-sales-row">
                        <label className="beta-sales-label">판매(개)</label>
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          className="beta-sales-input"
                          value={sales[p.id] ?? 0}
                          onChange={(e) => setSale(p.id, e.target.valueAsNumber)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="beta-report-actions">
        <button type="submit" className="btn btn-primary beta-submit-btn" disabled={saving}>
          {saving ? '저장 중…' : (initialReport ? '수정 제출' : '보고 제출')}
        </button>
      </div>
    </form>
  );
}
