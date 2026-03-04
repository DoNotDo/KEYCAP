import { useState, useMemo } from 'react';
import { BOMItem, InventoryItem } from '../types';
import { CheckSquare, Square, Save } from 'lucide-react';

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

  const finishedList = useMemo(() => [...finishedItems].sort((a, b) => a.name.localeCompare(b.name)), [finishedItems]);

  const loadCurrentBOM = (materialId: string) => {
    const boms = getBOMByMaterial(materialId);
    const next: Record<string, { checked: boolean; quantity: number }> = {};
    finishedList.forEach(f => {
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

  const handleSave = () => {
    if (!selectedMaterialId) return;
    const list = finishedList
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
                    {finishedList.map(f => (
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
                    ))}
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
