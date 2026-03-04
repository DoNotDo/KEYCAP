import { useState } from 'react';
import { MaterialOrder, InventoryItem } from '../types';
import { X, CheckSquare, Square, PackageCheck } from 'lucide-react';

interface MaterialOrderReceiveModalProps {
  orders: MaterialOrder[];
  materialItems: InventoryItem[];
  onReceive: (orderId: string, updates: { status: 'received'; receivedQuantity: number; receivedAt: string }) => void;
  onClose: () => void;
}

export function MaterialOrderReceiveModal({ orders, materialItems, onReceive, onClose }: MaterialOrderReceiveModalProps) {
  const pending = orders.filter(o => o.status === 'ordered' || o.status === 'partial');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [receivedQty, setReceivedQty] = useState<Record<string, number>>({});

  const getMaterialName = (id: string) => materialItems.find(i => i.id === id)?.name ?? id;

  const toggle = (orderId: string) => {
    setChecked(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    const order = pending.find(o => o.id === orderId);
    if (order && !checked[orderId]) setReceivedQty(prev => ({ ...prev, [orderId]: order.quantity }));
  };

  const toggleAll = () => {
    const allOn = pending.every(o => checked[o.id]);
    if (allOn) {
      setChecked({});
      setReceivedQty({});
    } else {
      const next: Record<string, boolean> = {};
      const qty: Record<string, number> = {};
      pending.forEach(o => { next[o.id] = true; qty[o.id] = o.quantity; });
      setChecked(next);
      setReceivedQty(qty);
    }
  };

  const handleSubmit = () => {
    const now = new Date().toISOString();
    pending.forEach(o => {
      if (!checked[o.id]) return;
      const qty = Math.max(0, receivedQty[o.id] ?? o.quantity);
      onReceive(o.id, { status: 'received', receivedQuantity: qty, receivedAt: now });
    });
    onClose();
  };

  const checkedCount = pending.filter(o => checked[o.id]).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h2>입고 처리 (품목별 체크)</h2>
          <button type="button" className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        <p className="section-desc">입고한 품목만 체크하고 수량을 입력하세요. 체크 안 된 품목은 지연/추가 발주 필요로 대시보드에 표시됩니다.</p>
        {pending.length === 0 ? (
          <p className="empty-state">입고 대기 중인 발주가 없습니다.</p>
        ) : (
          <>
            <div className="receive-modal-toolbar">
              <button type="button" className="btn btn-small btn-secondary" onClick={toggleAll}>
                {pending.every(o => checked[o.id]) ? <Square size={18} /> : <CheckSquare size={18} />}
                전체 선택/해제
              </button>
              <span className="receive-modal-count">선택 {checkedCount}건</span>
            </div>
            <div className="receive-modal-table-wrap">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>입고</th>
                    <th>부자재</th>
                    <th>업체</th>
                    <th>발주 수량</th>
                    <th style={{ width: 100 }}>입고 수량</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(o => (
                    <tr key={o.id}>
                      <td>
                        <button type="button" className="icon-btn" onClick={() => toggle(o.id)} title={checked[o.id] ? '체크 해제' : '입고 완료'}>
                          {checked[o.id] ? <CheckSquare size={20} color="#1a73e8" /> : <Square size={20} color="#9aa0a6" />}
                        </button>
                      </td>
                      <td>{getMaterialName(o.materialItemId)}</td>
                      <td>{o.supplier ?? '-'}</td>
                      <td>{o.quantity}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={checked[o.id] ? (receivedQty[o.id] ?? o.quantity) : ''}
                          onChange={e => setReceivedQty(prev => ({ ...prev, [o.id]: Number(e.target.value) }))}
                          disabled={!checked[o.id]}
                          className="form-input-small"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
              <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={checkedCount === 0}>
                <PackageCheck size={18} />
                선택 항목 입고 처리
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
