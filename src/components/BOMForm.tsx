import { useState, FormEvent, useEffect } from 'react';
import { BOMItem, InventoryItem } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface BOMFormProps {
  finishedItem: InventoryItem;
  bomItems: BOMItem[];
  materialItems: InventoryItem[];
  onSave: (bomItems: Omit<BOMItem, 'id'>[]) => void;
  onCancel: () => void;
}

export const BOMForm = ({ finishedItem, bomItems, materialItems, onSave, onCancel }: BOMFormProps) => {
  const [bomList, setBomList] = useState<Array<{ materialItemId: string; quantity: number }>>(
    bomItems.length > 0
      ? bomItems.map(bom => ({ materialItemId: bom.materialItemId, quantity: bom.quantity }))
      : [{ materialItemId: '', quantity: 0 }]
  );

  // bomItems가 변경되면 bomList 업데이트
  useEffect(() => {
    if (bomItems.length > 0) {
      setBomList(bomItems.map(bom => ({ materialItemId: bom.materialItemId, quantity: bom.quantity })));
    } else {
      setBomList([{ materialItemId: '', quantity: 0 }]);
    }
  }, [bomItems]);

  const handleAddRow = () => {
    setBomList([...bomList, { materialItemId: '', quantity: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    setBomList(bomList.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: 'materialItemId' | 'quantity', value: string | number) => {
    const updated = [...bomList];
    updated[index] = { ...updated[index], [field]: value };
    setBomList(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const validBOM = bomList.filter(
      item => item.materialItemId && item.quantity > 0
    );
    if (validBOM.length > 0 || bomList.length === 0) {
      onSave(validBOM);
    } else {
      alert('유효한 부자재를 최소 1개 이상 추가해주세요.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>BOM 설정 - {finishedItem.name}</h2>
          <button className="close-btn" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="item-form">
          <div className="bom-description">
            <p>완성재고 <strong>1개</strong> 생산에 필요한 부자재와 수량을 설정하세요.</p>
          </div>

          <div className="bom-table-container">
            <table className="bom-table">
              <thead>
                <tr>
                  <th>부자재</th>
                  <th>소모량 (개당)</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {bomList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      부자재를 추가하세요
                    </td>
                  </tr>
                ) : (
                  bomList.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          value={item.materialItemId}
                          onChange={(e) => handleChange(index, 'materialItemId', e.target.value)}
                          className="form-select"
                          required
                        >
                          <option value="">부자재 선택</option>
                          {(() => {
                            // 카테고리별로 그룹화
                            const groupedByCategory = materialItems.reduce((acc, material) => {
                              const category = material.category || '기타';
                              if (!acc[category]) {
                                acc[category] = [];
                              }
                              acc[category].push(material);
                              return acc;
                            }, {} as Record<string, InventoryItem[]>);
                            
                            // 카테고리명으로 정렬
                            const sortedCategories = Object.keys(groupedByCategory).sort();
                            
                            return sortedCategories.map(category => (
                              <optgroup key={category} label={category}>
                                {groupedByCategory[category].map(material => (
                                  <option key={material.id} value={material.id}>
                                    {material.name} ({material.quantity} {material.unit})
                                  </option>
                                ))}
                              </optgroup>
                            ));
                          })()}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleChange(index, 'quantity', Number(e.target.value))}
                          min="0.01"
                          step="0.01"
                          className="form-input-small"
                          required
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          className="icon-btn danger"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <button
              type="button"
              onClick={handleAddRow}
              className="btn btn-secondary"
              style={{ marginTop: '12px' }}
            >
              <Plus size={18} />
              부자재 추가
            </button>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
