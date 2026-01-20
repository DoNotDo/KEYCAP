import { useState, FormEvent, useEffect, useMemo } from 'react';
import { InventoryItem, MaterialConsumption } from '../types';
import { X, AlertTriangle, Search, Package, Info } from 'lucide-react';
import { MaterialConsumptionPanel } from './MaterialConsumptionPanel';

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
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedItem = finishedItems.find(item => item.id === finishedItemId);
  const hasShortage = consumptionResults?.some(result => result.isShortage) || false;
  const shortageCount = consumptionResults?.filter(result => result.isShortage).length || 0;
  
  // 지점 목록이 없으면 orders에서 추출 (나중에 App에서 전달)
  const availableBranches = branches || [];
  
  // 검색 필터링된 완성재고 목록
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return finishedItems;
    const term = searchTerm.toLowerCase();
    return finishedItems.filter(item => 
      item.name.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );
  }, [finishedItems, searchTerm]);
  
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
    if (hasShortage) {
      const confirmMessage = `⚠️ 재고 부족 경고\n\n${shortageCount}개의 부자재가 부족합니다.\n그래도 주문을 등록하시겠습니까?`;
      if (!confirm(confirmMessage)) {
        return;
      }
    }
    onProcess(branchName, finishedItemId, quantity);
    // 폼 초기화
    setFinishedItemId('');
    setQuantity(1);
    setSearchTerm('');
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>지점 발주 입력</h2>
          <button className="close-btn" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="item-form">
          {/* 지점 선택 */}
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

          {/* 완성재고 검색 및 선택 */}
          <div className="form-group">
            <label>완성재고 *</label>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5f6368' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="완성재고 검색..."
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <select
              value={finishedItemId}
              onChange={(e) => {
                setFinishedItemId(e.target.value);
                setSearchTerm(''); // 선택 시 검색어 초기화
              }}
              required
              className="form-select"
              style={{ marginTop: '8px' }}
            >
              <option value="">완성재고를 선택하세요</option>
              {filteredItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (재고: {item.quantity.toLocaleString()} {item.unit})
                </option>
              ))}
            </select>
            {searchTerm && filteredItems.length === 0 && (
              <p style={{ marginTop: '8px', color: '#f56565', fontSize: '14px' }}>
                검색 결과가 없습니다.
              </p>
            )}
          </div>

          {/* 선택한 완성재고 정보 카드 */}
          {selectedItem && (
            <div style={{
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #e0e0e0',
              display: 'flex',
              gap: '16px'
            }}>
              {/* 이미지 미리보기 */}
              {selectedItem.imageUrl && (
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Package size={20} color="#1a73e8" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{selectedItem.name}</h3>
                </div>
                {selectedItem.sku && (
                  <div style={{ marginBottom: '8px', fontSize: '14px', color: '#5f6368' }}>
                    <span style={{ fontWeight: 600 }}>코드:</span> {selectedItem.sku}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <div>
                    <span style={{ color: '#5f6368' }}>현재 재고:</span>
                    <span style={{ marginLeft: '8px', fontWeight: 600, color: selectedItem.quantity > 0 ? '#48bb78' : '#f56565' }}>
                      {selectedItem.quantity.toLocaleString()} {selectedItem.unit}
                    </span>
                  </div>
                  {selectedItem.price > 0 && (
                    <div>
                      <span style={{ color: '#5f6368' }}>단가:</span>
                      <span style={{ marginLeft: '8px', fontWeight: 600 }}>
                        {selectedItem.price.toLocaleString()}원
                      </span>
                    </div>
                  )}
                  {selectedItem.location && (
                    <div>
                      <span style={{ color: '#5f6368' }}>보관 위치:</span>
                      <span style={{ marginLeft: '8px' }}>{selectedItem.location}</span>
                    </div>
                  )}
                </div>
                {selectedItem.description && (
                  <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', fontSize: '14px', color: '#5f6368' }}>
                    <Info size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    {selectedItem.description}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 주문 수량 입력 */}
          <div className="form-group">
            <label>주문 수량 *</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  setQuantity(val);
                }}
                min="1"
                required
                style={{ flex: 1 }}
              />
              {selectedItem && (
                <span style={{ color: '#5f6368', fontSize: '14px', whiteSpace: 'nowrap' }}>
                  {selectedItem.unit}
                </span>
              )}
            </div>
            {selectedItem && quantity > 0 && (
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e8f0fe', borderRadius: '4px', fontSize: '14px' }}>
                <span style={{ color: '#5f6368' }}>총 필요 재고:</span>
                <span style={{ marginLeft: '8px', fontWeight: 600, color: quantity > selectedItem.quantity ? '#f56565' : '#1a73e8' }}>
                  {quantity.toLocaleString()} {selectedItem.unit}
                  {quantity > selectedItem.quantity && (
                    <span style={{ marginLeft: '8px', color: '#f56565' }}>
                      (부족: {(quantity - selectedItem.quantity).toLocaleString()} {selectedItem.unit})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* 예상 부자재 소모량 표시 */}
          {consumptionResults && consumptionResults.length > 0 && quantity > 0 && (
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <div style={{ 
                padding: '12px', 
                backgroundColor: hasShortage ? '#fff3cd' : '#d1ecf1', 
                borderRadius: '8px',
                border: `1px solid ${hasShortage ? '#ffc107' : '#bee5eb'}`,
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {hasShortage ? (
                    <>
                      <AlertTriangle size={20} color="#f56565" />
                      <span style={{ fontWeight: 600, color: '#f56565' }}>
                        {shortageCount}개 부자재 재고 부족
                      </span>
                    </>
                  ) : (
                    <>
                      <Info size={20} color="#1a73e8" />
                      <span style={{ fontWeight: 600, color: '#1a73e8' }}>
                        예상 부자재 소모량
                      </span>
                    </>
                  )}
                </div>
                <MaterialConsumptionPanel consumptions={consumptionResults} />
              </div>
            </div>
          )}

          {/* 재고 부족 경고 */}
          {hasShortage && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee',
              borderRadius: '8px',
              border: '1px solid #f56565',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={20} color="#f56565" />
              <div>
                <strong style={{ color: '#f56565' }}>재고 부족 경고</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#5f6368' }}>
                  {shortageCount}개의 부자재가 부족합니다. 주문 등록 시 재고 부족 상태로 표시됩니다.
                </p>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              취소
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ 
                backgroundColor: hasShortage ? '#f56565' : undefined,
                borderColor: hasShortage ? '#f56565' : undefined
              }}
            >
              {hasShortage ? '⚠️ 주문 등록 (재고 부족)' : '주문 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
