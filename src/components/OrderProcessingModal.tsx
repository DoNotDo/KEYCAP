import { useState, FormEvent, useMemo } from 'react';
import { Order, InventoryItem, BOMItem } from '../types';
import { X, CheckSquare, Square, Truck, PackageCheck } from 'lucide-react';

interface OrderProcessingModalProps {
  orders: Order[]; // 지점별 주문 목록
  items: InventoryItem[];
  bomItems: BOMItem[];
  onStartProcessing: (orderIds: string[]) => void;
  onShip: (orderId: string, shippedQuantity: number) => void;
  onReceive: (orderId: string) => void;
  onClose: () => void;
  currentUserBranch?: string;
  isAdmin: boolean;
}


export const OrderProcessingModal = ({ 
  orders, 
  items, 
  bomItems, 
  onStartProcessing, 
  onShip, 
  onReceive, 
  onClose,
  currentUserBranch,
  isAdmin
}: OrderProcessingModalProps) => {
  // 지점별로 주문 그룹화 (finishedItemName은 실시간 계산)
  const ordersByBranch = useMemo(() => {
    const grouped: { [branch: string]: Order[] } = {};
    orders.forEach(order => {
      if (!grouped[order.branchName]) {
        grouped[order.branchName] = [];
      }
      grouped[order.branchName].push(order);
    });
    return grouped;
  }, [orders]);

  // 실시간으로 완성재고 이름 가져오기
  const getFinishedItemName = (order: Order) => {
    const finishedItem = items.find(item => item.id === order.finishedItemId);
    return finishedItem?.name || '알 수 없음';
  };

  const getOrderBOM = (order: Order) => {
    return bomItems.filter(bom => bom.finishedItemId === order.finishedItemId);
  };

  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [shippingQuantities, setShippingQuantities] = useState<{ [orderId: string]: number }>({});

  const handleToggleOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setShippingQuantities(prev => ({
          ...prev,
          [orderId]: order.quantity,
        }));
      }
    }
    setSelectedOrders(newSelected);
  };

  const handleQuantityChange = (orderId: string, quantity: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const maxQuantity = order.quantity;
    const validQuantity = Math.max(1, Math.min(quantity, maxQuantity));
    
    setShippingQuantities(prev => ({
      ...prev,
      [orderId]: validQuantity,
    }));
  };

  const handleStartProcessing = () => {
    const orderIds = Array.from(selectedOrders);
    if (orderIds.length === 0) {
      alert('처리할 주문을 선택해주세요.');
      return;
    }
    onStartProcessing(orderIds);
    setSelectedOrders(new Set());
    setShippingQuantities({});
  };

  const handleShipSelected = (e: FormEvent) => {
    e.preventDefault();
    const orderIds = Array.from(selectedOrders);
    if (orderIds.length === 0) {
      alert('출고할 주문을 선택해주세요.');
      return;
    }

    let hasError = false;
    orderIds.forEach(orderId => {
      const quantity = shippingQuantities[orderId];
      if (!quantity || quantity <= 0) {
        hasError = true;
      }
    });

    if (hasError) {
      alert('모든 선택된 주문의 출고 수량을 입력해주세요.');
      return;
    }

    orderIds.forEach(orderId => {
      const quantity = shippingQuantities[orderId];
      onShip(orderId, quantity);
    });

    setSelectedOrders(new Set());
    setShippingQuantities({});
  };

  const handleReceive = (orderId: string) => {
    if (confirm('입고 처리를 하시겠습니까?')) {
      onReceive(orderId);
    }
  };

  const getItemName = (itemId: string) => {
    return items.find(item => item.id === itemId)?.name || '알 수 없음';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  // 어드민인 경우 모든 지점, 직원인 경우 자신의 지점만
  const branchesToShow = isAdmin 
    ? Object.keys(ordersByBranch)
    : currentUserBranch 
      ? [currentUserBranch]
      : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h2>발주 처리</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="order-processing-content">
          {branchesToShow.map(branchName => {
            const branchOrders = ordersByBranch[branchName] || [];
            const pendingOrders = branchOrders.filter(o => o.status === 'pending');
            const processingOrders = branchOrders.filter(o => o.status === 'processing');
            const shippingOrders = branchOrders.filter(o => o.status === 'shipping');
            const receivedOrders = branchOrders.filter(o => o.status === 'received');

            return (
              <div key={branchName} className="branch-orders-section" style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '16px', color: '#1a73e8', fontSize: '20px' }}>
                  {branchName}
                </h3>

                {/* 대기 중인 주문 - 처리 시작 */}
                {pendingOrders.length > 0 && isAdmin && (
                  <div className="order-status-group">
                    <h4 style={{ marginBottom: '12px', color: '#5f6368' }}>대기 중인 주문</h4>
                    <div className="order-list-table">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                            <th style={{ padding: '12px', textAlign: 'left', width: '40px' }}>선택</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>완성재고</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>요청 수량</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>주문일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingOrders.map(order => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleOrder(order.id)}
                                  className="icon-btn"
                                  style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                                >
                                  {selectedOrders.has(order.id) ? (
                                    <CheckSquare size={20} color="#1a73e8" />
                                  ) : (
                                    <Square size={20} color="#9aa0a6" />
                                  )}
                                </button>
                              </td>
                              <td style={{ padding: '12px' }}>{getFinishedItemName(order)}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>{order.quantity}개</td>
                              <td style={{ padding: '12px' }}>{formatDate(order.orderDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {selectedOrders.size > 0 && (
                        <div style={{ marginTop: '16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={handleStartProcessing}
                            className="btn btn-primary"
                          >
                            처리 시작 ({selectedOrders.size}개)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 처리 중인 주문 - 출고 처리 */}
                {processingOrders.length > 0 && isAdmin && (
                  <div className="order-status-group" style={{ marginTop: '24px' }}>
                    <h4 style={{ marginBottom: '12px', color: '#5f6368' }}>처리 중인 주문</h4>
                    <form onSubmit={handleShipSelected}>
                      <div className="order-list-table">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                              <th style={{ padding: '12px', textAlign: 'left', width: '40px' }}>선택</th>
                              <th style={{ padding: '12px', textAlign: 'left' }}>완성재고</th>
                              <th style={{ padding: '12px', textAlign: 'right' }}>요청 수량</th>
                              <th style={{ padding: '12px', textAlign: 'right' }}>출고 수량</th>
                              <th style={{ padding: '12px', textAlign: 'left' }}>예상 소모 부자재</th>
                            </tr>
                          </thead>
                        <tbody>
                          {processingOrders.map(order => {
                            const shippingQty = shippingQuantities[order.id] || order.quantity;
                            const completionRate = Math.round((shippingQty / order.quantity) * 100);
                            return (
                              <tr key={order.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleOrder(order.id)}
                                    className="icon-btn"
                                    style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                                  >
                                    {selectedOrders.has(order.id) ? (
                                      <CheckSquare size={20} color="#1a73e8" />
                                    ) : (
                                      <Square size={20} color="#9aa0a6" />
                                    )}
                                  </button>
                                </td>
                                <td style={{ padding: '12px' }}>{getFinishedItemName(order)}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>{order.quantity}개</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                  <input
                                    type="number"
                                    min="1"
                                    max={order.quantity}
                                    value={shippingQty}
                                    onChange={(e) => handleQuantityChange(order.id, Number(e.target.value))}
                                    style={{ width: '80px', padding: '6px', border: '1px solid #dadce0', borderRadius: '4px' }}
                                    required
                                  />
                                  <span style={{ marginLeft: '4px', color: '#5f6368' }}>
                                    / {order.quantity}개 
                                    <span style={{ marginLeft: '8px', color: completionRate >= 100 ? '#48bb78' : '#ed8936', fontWeight: 600 }}>
                                      ({completionRate}%)
                                    </span>
                                  </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  {getOrderBOM(order).length > 0 ? (
                                    <div style={{ fontSize: '12px', color: '#5f6368' }}>
                                      {getOrderBOM(order).map((bom, idx) => {
                                        const material = items.find(item => item.id === bom.materialItemId);
                                        const qty = shippingQuantities[order.id] || order.quantity;
                                        return (
                                          <div key={bom.id}>
                                            {material?.name}: {bom.quantity * qty} {material?.unit}
                                            {idx < getOrderBOM(order).length - 1 && ', '}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span style={{ color: '#9aa0a6' }}>BOM 미설정</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          </tbody>
                        </table>
                        {selectedOrders.size > 0 && (
                          <div style={{ marginTop: '16px', textAlign: 'right' }}>
                            <button
                              type="submit"
                              className="btn btn-primary"
                            >
                              <Truck size={18} />
                              출고 처리 ({selectedOrders.size}개)
                            </button>
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                )}

                {/* 출고 완료 - 입고 대기 */}
                {shippingOrders.length > 0 && (
                  <div className="order-status-group" style={{ marginTop: '24px' }}>
                    <h4 style={{ marginBottom: '12px', color: '#5f6368' }}>출고 완료 (입고 대기)</h4>
                    <div className="order-list-table">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                            <th style={{ padding: '12px', textAlign: 'left' }}>완성재고</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>출고 수량</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>출고일</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>작업</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shippingOrders.map(order => {
                            const shippedQty = order.shippedQuantity || order.quantity;
                            const completionRate = Math.round((shippedQty / order.quantity) * 100);
                            return (
                              <tr key={order.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                <td style={{ padding: '12px' }}>{getFinishedItemName(order)}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                  {shippedQty}개 / {order.quantity}개
                                  <span style={{ marginLeft: '8px', color: completionRate >= 100 ? '#48bb78' : '#ed8936', fontWeight: 600 }}>
                                    ({completionRate}%)
                                  </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  {order.shippedAt ? formatDate(order.shippedAt) : '-'}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  {!isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => handleReceive(order.id)}
                                      className="btn btn-primary btn-small"
                                    >
                                      <PackageCheck size={16} />
                                      입고 처리
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 입고 완료 */}
                {receivedOrders.length > 0 && (
                  <div className="order-status-group" style={{ marginTop: '24px' }}>
                    <h4 style={{ marginBottom: '12px', color: '#5f6368' }}>입고 완료</h4>
                    <div className="order-list-table">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                            <th style={{ padding: '12px', textAlign: 'left' }}>완성재고</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>수량</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>입고일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receivedOrders.map(order => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                              <td style={{ padding: '12px' }}>{getFinishedItemName(order)}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>{order.shippedQuantity || order.quantity}개</td>
                              <td style={{ padding: '12px' }}>
                                {order.receivedAt ? formatDate(order.receivedAt) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {branchesToShow.length === 0 && (
            <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: '#5f6368' }}>
              처리할 주문이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
