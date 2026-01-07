import { useState, FormEvent, useEffect } from 'react';
import { InventoryItem, MaterialConsumption } from '../types';
import { X, AlertTriangle } from 'lucide-react';

interface OrderFormProps {
  finishedItems: InventoryItem[];
  branches?: string[]; // 지점 목록 (admin인 경우)
  onProcess: (branchName: string, finishedItemId: string, quantity: number) => void;
  onCancel: () => void;
  consumptionResults?: MaterialConsumption[];
  onChange?: (finishedItemId: string, quantity: number) => void;
  defaultBranchName?: string;
  isAdmin?: boolean;
}

export const OrderForm = ({ finishedItems, branches, onProcess, onCancel, consumptionResults, onChange, defaultBranchName, isAdmin }: OrderFormProps) => {
  const [branchName, setBranchName] = useState(defaultBranchName || '');
  const [finishedItemId, setFinishedItemId] = useState('');
  const [quantity, setQuantity] = useState(0);

  const selectedItem = finishedItems.find(item => item.id === finishedItemId);
  const hasShortage = consumptionResults?.some(result => result.isShortage) || false;
  
  // 지점 목록이 없으면 orders에서 추출 (나중에 App에서 전달)
  const availableBranches = branches || [];
  
  // 실시간 계산을 위해 부모 컴포넌트에 변경사항 전달
  useEffect(() => {
    if (onChange) {
      onChange(finishedItemId, quantity);
    }
  }, [finishedItemId, quantity, onChange]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!branchName || !finishedItemId || quantity <= 0) {
      alert('모든 필드를 올바르게 입력해주세요.');
      return;
    }
    onProcess(branchName, finishedItemId, quantity);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>지점 주문/수요 입력</h2>
          <button className="close-btn" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="item-form">
          <div className="form-group">
            <label>지점명 *</label>
            {isAdmin && availableBranches.length > 0 ? (
              <select
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="form-select"
                required
              >
                <option value="">지점 선택</option>
                {availableBranches.map(branch => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="예: 강남점, 서초점 등"
                required
                disabled={!!defaultBranchName}
              />
            )}
          </div>

          <div className="form-group">
            <label>완성재고 *</label>
            <select
              value={finishedItemId}
              onChange={(e) => setFinishedItemId(e.target.value)}
              required
              className="form-select"
            >
              <option value="">완성재고 선택</option>
              {finishedItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (재고: {item.quantity} {item.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>주문 수량 *</label>
            <input
              type="number"
              value={quantity || ''}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              required
            />
          </div>


          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              주문 등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
