import { useState, FormEvent, useEffect } from 'react';
import { InventoryItem, ItemType } from '../types';
import { storage } from '../utils/storage';
import { BetaProduct } from '../types';
import { X } from 'lucide-react';

interface ItemFormProps {
  item?: InventoryItem;
  defaultType?: ItemType;
  branches?: string[];
  defaultBranchName?: string;
  isAdmin?: boolean;
  onSubmit: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const ItemForm = ({ item, defaultType, branches, defaultBranchName, isAdmin, onSubmit, onCancel }: ItemFormProps) => {
  const [betaProducts, setBetaProducts] = useState<BetaProduct[]>([]);
  const [formData, setFormData] = useState({
    branchName: item?.branchName || defaultBranchName || '',
    name: item?.name || '',
    sku: item?.sku || '',
    imageUrl: item?.imageUrl || '',
    category: item?.category || '',
    type: (item?.type || defaultType || 'material') as ItemType,
    betaProductId: item?.betaProductId || '',
    quantity: item?.quantity || 0,
    minQuantity: item?.minQuantity || 0,
    maxQuantity: item?.maxQuantity || 0,
    unit: item?.unit || '개',
    price: item?.price || 0,
    location: item?.location || '',
    description: item?.description || '',
  });

  useEffect(() => {
    if (formData.type === 'finished') {
      storage.getBetaProductsAsync().then(() => setBetaProducts(storage.getBetaProducts()));
    }
  }, [formData.type]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSubmit(formData);
  };

  const handleNumberChange = (field: 'quantity' | 'minQuantity' | 'maxQuantity' | 'price', value: string) => {
    // 빈 문자열이면 0으로, 아니면 숫자로 변환
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData({ ...formData, [field]: numValue });
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? '재고 항목 수정' : '새 재고 항목 추가'}</h2>
          <button className="close-btn" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="item-form">
          <div className="form-row">
            <div className="form-group">
              <label>지점 *</label>
              {isAdmin && branches && branches.length > 0 ? (
                <select
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="">지점 선택</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  placeholder="지점명"
                  required
                  disabled={!!defaultBranchName}
                />
              )}
            </div>
            <div className="form-group">
              <label>품목명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>재고 타입 *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ItemType, betaProductId: e.target.value === 'material' ? '' : formData.betaProductId })}
                required
                className="form-select"
              >
                <option value="material">부자재</option>
                <option value="finished">완성재고</option>
              </select>
            </div>
            {formData.type === 'finished' && betaProducts.length > 0 && (
              <div className="form-group">
                <label>주간보고 품목 연동</label>
                <select
                  value={formData.betaProductId}
                  onChange={(e) => setFormData({ ...formData, betaProductId: e.target.value })}
                  className="form-select"
                >
                  <option value="">선택 안 함</option>
                  {betaProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>상품 코드</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="예: MAT-001"
              />
            </div>
            <div className="form-group">
              <label>카테고리 *</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>현재 수량 *</label>
              <input
                type="number"
                value={formData.quantity || ''}
                onChange={(e) => handleNumberChange('quantity', e.target.value)}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    setFormData({ ...formData, quantity: 0 });
                  }
                }}
                min="0"
                step="1"
                required
              />
            </div>
            <div className="form-group">
              <label>단위 *</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>최소 수량 *</label>
              <input
                type="number"
                value={formData.minQuantity || ''}
                onChange={(e) => handleNumberChange('minQuantity', e.target.value)}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    setFormData({ ...formData, minQuantity: 0 });
                  }
                }}
                min="0"
                step="1"
                required
              />
            </div>
            <div className="form-group">
              <label>최대 수량 *</label>
              <input
                type="number"
                value={formData.maxQuantity || ''}
                onChange={(e) => handleNumberChange('maxQuantity', e.target.value)}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    setFormData({ ...formData, maxQuantity: 0 });
                  }
                }}
                min="0"
                step="1"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>단가 (원) *</label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => handleNumberChange('price', e.target.value)}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    setFormData({ ...formData, price: 0 });
                  }
                }}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>보관 위치</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>이미지 URL</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="/catalog/images/파일명.png"
            />
          </div>

          <div className="form-group">
            <label>설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              {item ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
