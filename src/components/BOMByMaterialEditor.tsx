import { useState, useMemo } from 'react';
import { BOMItem, InventoryItem } from '../types';
import { CheckSquare, Square, Save, Search } from 'lucide-react';

interface BOMByMaterialEditorProps {
  materialItems: InventoryItem[];
  finishedItems: InventoryItem[];
  getBOMByMaterial: (materialItemId: string) => BOMItem[];
  onSave: (materialItemId: string, list: { finishedItemId: string; quantity: number }[]) => void;
}

export function BOMByMaterialEditor({
  materialItems,
  finishedItems,
  getBOMByMaterial,
  onSave,
}: BOMByMaterialEditorProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [rows, setRows] = useState<Record<string, { checked: boolean; quantity: number }>>({});
  const [finishedSearch, setFinishedSearch] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState<string>('');

  const selectedMaterial = useMemo(() => materialItems.find(m => m.id === selectedMaterialId), [materialItems, selectedMaterialId]);

  const byCategory = useMemo(() => {
    const map = new Map<string, InventoryItem[]>();
    materialItems.forEach(item => {
      const cat = item.category || '미분류';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [materialItems]);

  const finishedListAll = useMemo(() => [...finishedItems].sort((a, b) => a.name.localeCompare(b.name)), [finishedItems]);
  const finishedList = useMemo(() => {
    if (!finishedSearch.trim()) return finishedListAll;
    const q = finishedSearch.trim().toLowerCase();
    return finishedListAll.filter(f => f.name.toLowerCase().includes(q) || (f.category || '').toLowerCase().includes(q));
  }, [finishedListAll, finishedSearch]);

  const loadCurrentBOM = (materialId: string) => {
    const boms = getBOMByMaterial(materialId);
    const next: Record<string, { checked: boolean; quantity: number }> = {};
    finishedListAll.forEach(f => {
      const bom = boms.find(b => b.finishedItemId === f.id);
      next[f.id] = { checked: !!bom, quantity: bom?.quantity ?? 1 };
    });
    setRows(next);
  };

  const handleSelectMaterial = (id: string) => {
    setSelectedMaterialId(id);
    if (id) loadCurrentBOM(id);
    else setRows({});
  };

  const toggleFinished = (finishedId: string) => {
    setRows(prev => {
      const cur = prev[finishedId] ?? { checked: false, quantity: 1 };
      return { ...prev, [finishedId]: { ...cur, checked: !cur.checked } };
    });
  };

  const setQuantity = (finishedId: string, quantity: number) => {
    setRows(prev => {
      const cur = prev[finishedId] ?? { checked: true, quantity: 1 };
      return { ...prev, [finishedId]: { ...cur, quantity: Math.max(0, quantity) } };
    });
  };

  const allChecked = finishedList.length > 0 && finishedList.every(f => rows[f.id]?.checked);
  const toggleAllFinished = () => {
    const next = allChecked ? false : true;
    setRows(prev => {
      const nextRows = { ...prev };
      finishedList.forEach(f => {
        nextRows[f.id] = { ...(prev[f.id] ?? { checked: false, quantity: 1 }), checked: next };
      });
      return nextRows;
    });
  };

  const applyBulkQuantity = () => {
    const q = Number(bulkQuantity);
    if (Number.isNaN(q) || q < 0) return;
    setRows(prev => {
      const nextRows = { ...prev };
      finishedList.forEach(f => {
        if (nextRows[f.id]?.checked) nextRows[f.id] = { ...nextRows[f.id], quantity: q };
      });
      return nextRows;
    });
  };

  const handleSave = () => {
    if (!selectedMaterialId) return;
    const list = finishedListAll
      .filter(f => rows[f.id]?.checked && (rows[f.id]?.quantity ?? 0) > 0)
      .map(f => ({ finishedItemId: f.id, quantity: rows[f.id]?.quantity ?? 1 }));
    onSave(selectedMaterialId, list);
    alert('저장되었습니다.');
  };

  return (
    <div className="bom-by-material-editor">
      <div className="bom-by-material-layout">
        <div className="bom-material-list">
          <h4>부자재 선택</h4>
          <p className="section-desc">부자재를 선택한 뒤, 사용하는 완성재고를 체크하고 개당 수량을 입력하세요.</p>
          {byCategory.map(([category, list]) => (
            <div key={category} className="bom-material-category">
              <span className="bom-material-cat-name">{category}</span>
              <ul>
                {list.map(m => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={`bom-material-btn ${selectedMaterialId === m.id ? 'active' : ''}`}
                      onClick={() => handleSelectMaterial(selectedMaterialId === m.id ? '' : m.id)}
                    >
                      {m.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="bom-finished-list">
          {selectedMaterialId ? (
            <>
              <h4>{selectedMaterial?.name} → 사용 완성재고</h4>
              <div className="bom-finished-toolbar">
                <div className="search-box bom-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="완성재고 검색..."
                    value={finishedSearch}
                    onChange={e => setFinishedSearch(e.target.value)}
                  />
                </div>
                <div className="bom-bulk-actions">
                  <label className="bom-bulk-label">
                    <button type="button" className="icon-btn" onClick={toggleAllFinished} title={allChecked ? '전체 해제' : '전체 선택'}>
                      {allChecked ? <CheckSquare size={20} color="#1a73e8" /> : <Square size={20} color="#9aa0a6" />}
                    </button>
                    <span>전체 선택</span>
                  </label>
                  <div className="bom-bulk-qty">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="일괄 수량"
                      value={bulkQuantity}
                      onChange={e => setBulkQuantity(e.target.value)}
                      className="form-input-small"
                    />
                    <button type="button" className="btn btn-small btn-secondary" onClick={applyBulkQuantity}>적용</button>
                  </div>
                </div>
              </div>
              <div className="bom-finished-table-wrap">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}>사용</th>
                      <th>완성재고</th>
                      <th style={{ width: 100 }}>개당 수량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finishedList.length === 0 ? (
                      <tr><td colSpan={3} className="empty-state">검색 결과 없음</td></tr>
                    ) : (
                      finishedList.map(f => (
                        <tr key={f.id}>
                          <td>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => toggleFinished(f.id)}
                              title={rows[f.id]?.checked ? '체크 해제' : '체크'}
                            >
                              {rows[f.id]?.checked ? <CheckSquare size={20} color="#1a73e8" /> : <Square size={20} color="#9aa0a6" />}
                            </button>
                          </td>
                          <td>{f.name}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={rows[f.id]?.quantity ?? ''}
                              onChange={e => setQuantity(f.id, Number(e.target.value))}
                              disabled={!rows[f.id]?.checked}
                              className="form-input-small"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn btn-primary" onClick={handleSave} style={{ marginTop: 12 }}>
                <Save size={18} />
                저장
              </button>
            </>
          ) : (
            <p className="empty-inline">왼쪽에서 부자재를 선택하세요.</p>
          )}
        </div>
      </div>
    </div>
  );
}
