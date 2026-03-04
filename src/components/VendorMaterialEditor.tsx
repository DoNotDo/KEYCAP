import { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { Package, Save } from 'lucide-react';

interface VendorMaterialEditorProps {
  materialItems: InventoryItem[];
  suppliers: string[];
  getMaterialIdsBySupplier: (supplier: string) => string[];
  setVendorMaterialsForSupplier: (supplier: string, materialItemIds: string[]) => void;
}

export function VendorMaterialEditor({
  materialItems,
  suppliers,
  getMaterialIdsBySupplier,
  setVendorMaterialsForSupplier,
}: VendorMaterialEditorProps) {
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);

  const currentRegistered = useMemo(() => {
    if (!selectedSupplier) return new Set<string>();
    return new Set(getMaterialIdsBySupplier(selectedSupplier));
  }, [selectedSupplier, getMaterialIdsBySupplier]);

  const isDirty = useMemo(() => {
    if (checkedIds.size !== currentRegistered.size) return true;
    for (const id of checkedIds) if (!currentRegistered.has(id)) return true;
    for (const id of currentRegistered) if (!checkedIds.has(id)) return true;
    return false;
  }, [checkedIds, currentRegistered]);

  const handleSelectSupplier = (supplier: string) => {
    setSelectedSupplier(supplier);
    const ids = supplier ? getMaterialIdsBySupplier(supplier) : [];
    setCheckedIds(new Set(ids));
    setSaved(false);
  };

  const toggleMaterial = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => {
    if (!selectedSupplier.trim()) {
      alert('업체를 선택하세요.');
      return;
    }
    setVendorMaterialsForSupplier(selectedSupplier.trim(), Array.from(checkedIds));
    setSaved(true);
  };

  return (
    <div className="vendor-material-editor">
      <h3 className="vendor-material-title"><Package size={20} /> 업체별 부자재 등록</h3>
      <p className="vendor-material-desc">업체를 선택한 뒤, 해당 업체로 발주할 부자재만 체크해 두면 일괄 발주 시 해당 업체에 등록된 부자재만 표시됩니다.</p>
      <div className="vendor-material-form">
        <div className="form-group">
          <label>업체 선택 또는 입력</label>
          <input
            type="text"
            className="form-input"
            list="vendor-material-supplier-list"
            value={selectedSupplier}
            onChange={(e) => handleSelectSupplier(e.target.value)}
            placeholder="업체명 입력 또는 목록에서 선택"
          />
          <datalist id="vendor-material-supplier-list">
            {suppliers.map(s => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        {selectedSupplier && (
          <>
            <div className="vendor-material-list">
              {materialItems.map(m => (
                <label key={m.id} className="vendor-material-row">
                  <input
                    type="checkbox"
                    checked={checkedIds.has(m.id)}
                    onChange={() => toggleMaterial(m.id)}
                  />
                  <span>{m.name}</span>
                  <span className="vendor-material-meta">{m.category || '미분류'}</span>
                </label>
              ))}
            </div>
            {materialItems.length === 0 && <p className="empty-state">등록된 부자재가 없습니다. 재고 탭에서 부자재를 먼저 추가하세요.</p>}
            <div className="vendor-material-actions">
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!isDirty}>
                <Save size={18} /> 저장
              </button>
              {saved && <span className="vendor-material-saved">저장되었습니다.</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
