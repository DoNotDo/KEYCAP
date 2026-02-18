import { useMemo, useState } from 'react';
import { InventoryItem, Vendor, MaterialMaster, PurchaseRequest, PurchaseOrder, GoodsReceipt, InvoicePayment, AuditLog, ProcurementStatus, User, SupplierMaterialBOM } from '../types';
import { FileText, ClipboardCheck, PackageCheck, Receipt, ClipboardList, BarChart3, Download, Undo2 } from 'lucide-react';
import { TabNavigation } from './TabNavigation';

interface PurchaseManagementModuleProps {
  materialItems: InventoryItem[];
  supplierMaterialBOMs: SupplierMaterialBOM[];
  currentUser: User;
}

type UndoSnapshot = {
  requests: PurchaseRequest[];
  orders: PurchaseOrder[];
  receipts: GoodsReceipt[];
  payments: InvoicePayment[];
  auditLogs: AuditLog[];
};

const statusFlow: ProcurementStatus[] = ['requested', 'approved', 'ordered', 'received', 'settled'];

const getToday = () => new Date().toISOString().slice(0, 10);

const downloadCsv = (filename: string, rows: Array<Record<string, string | number>>) => {
  if (rows.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(key => `"${String(row[key] ?? '')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.click();
  URL.revokeObjectURL(url);
};

export const PurchaseManagementModule = ({ materialItems, supplierMaterialBOMs, currentUser }: PurchaseManagementModuleProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const supplierSet = new Set(supplierMaterialBOMs.map(bom => bom.supplierName.trim()).filter(Boolean));
    return Array.from(supplierSet).map(name => ({
      id: name,
      name,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  });
  const [materialMasters, setMaterialMasters] = useState<MaterialMaster[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [lastSnapshot, setLastSnapshot] = useState<UndoSnapshot | null>(null);

  const [requestForm, setRequestForm] = useState({
    materialItemId: '',
    quantity: '',
    neededBy: getToday(),
    vendorId: '',
    unitPrice: '',
    notes: '',
    checklist: {
      specConfirmed: false,
      costConfirmed: false,
      quantityConfirmed: false,
      deliveryConfirmed: false,
    },
  });

  const [masterForm, setMasterForm] = useState({
    materialItemId: '',
    unit: '',
    moq: '',
    leadTimeDays: '',
    reorderPoint: '',
    unitPrice: '',
  });

  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [receiptForm, setReceiptForm] = useState({
    poId: '',
    receivedQuantity: '',
    defectQuantity: '',
    inspectionNotes: '',
    photoUrls: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    poId: '',
    invoiceNumber: '',
    totalAmount: '',
    paidAmount: '',
    taxInvoiceIssued: false,
    notes: '',
  });

  const materialMap = useMemo(() => new Map(materialItems.map(item => [item.id, item])), [materialItems]);

  const masterMap = useMemo(() => {
    const map = new Map<string, MaterialMaster>();
    materialMasters.forEach(master => map.set(master.materialItemId, master));
    return map;
  }, [materialMasters]);

  const vendorMap = useMemo(() => new Map(vendors.map(v => [v.id, v])), [vendors]);

  const requestSummary = useMemo(() => {
    const today = new Date();
    const in7days = new Date();
    in7days.setDate(today.getDate() + 7);
    const approvalPending = requests.filter(r => r.status === 'requested').length;
    const delayed = requests.filter(r => ['requested', 'approved', 'ordered'].includes(r.status) && new Date(r.neededBy) < today).length;
    const upcoming = requests.filter(r => ['requested', 'approved', 'ordered'].includes(r.status) && new Date(r.neededBy) <= in7days && new Date(r.neededBy) >= today).length;
    const missing = requests.filter(r => !r.vendorId || !r.unitPrice || r.quantity <= 0).length;
    const lowStock = materialItems.filter(item => item.quantity <= item.minQuantity).length;
    return { approvalPending, delayed, upcoming, missing, lowStock };
  }, [requests, materialItems]);

  const addAuditLog = (entityType: AuditLog['entityType'], entityId: string, action: string, detail?: string) => {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      entityType,
      entityId,
      action,
      detail,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.username,
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const snapshot = () => {
    setLastSnapshot({
      requests,
      orders,
      receipts,
      payments,
      auditLogs,
    });
  };

  const handleUndo = () => {
    if (!lastSnapshot) return;
    setRequests(lastSnapshot.requests);
    setOrders(lastSnapshot.orders);
    setReceipts(lastSnapshot.receipts);
    setPayments(lastSnapshot.payments);
    setAuditLogs(lastSnapshot.auditLogs);
    setLastSnapshot(null);
  };

  const handleMasterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterForm.materialItemId || !masterForm.unit.trim()) {
      alert('부자재와 단위를 입력해주세요.');
      return;
    }
    snapshot();
    const existing = materialMasters.find(m => m.materialItemId === masterForm.materialItemId);
    const payload: MaterialMaster = {
      id: existing?.id || crypto.randomUUID(),
      materialItemId: masterForm.materialItemId,
      unit: masterForm.unit.trim(),
      moq: masterForm.moq ? Number(masterForm.moq) : undefined,
      leadTimeDays: masterForm.leadTimeDays ? Number(masterForm.leadTimeDays) : undefined,
      reorderPoint: masterForm.reorderPoint ? Number(masterForm.reorderPoint) : undefined,
      priceHistory: existing?.priceHistory || [],
      updatedAt: new Date().toISOString(),
    };
    if (masterForm.unitPrice) {
      payload.priceHistory = [
        ...(payload.priceHistory || []),
        {
          date: new Date().toISOString(),
          price: Number(masterForm.unitPrice),
          vendorId: undefined,
        },
      ];
    }
    if (existing) {
      setMaterialMasters(prev => prev.map(m => (m.materialItemId === payload.materialItemId ? payload : m)));
      addAuditLog('MaterialMaster', payload.id, 'update', `${payload.materialItemId} 마스터 업데이트`);
    } else {
      setMaterialMasters(prev => [...prev, payload]);
      addAuditLog('MaterialMaster', payload.id, 'create', `${payload.materialItemId} 마스터 추가`);
    }
    setMasterForm({
      materialItemId: '',
      unit: '',
      moq: '',
      leadTimeDays: '',
      reorderPoint: '',
      unitPrice: '',
    });
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const material = materialMap.get(requestForm.materialItemId);
    const master = masterMap.get(requestForm.materialItemId);
    if (!material) {
      alert('부자재를 선택해주세요.');
      return;
    }
    if (!requestForm.quantity || Number(requestForm.quantity) <= 0) {
      alert('수량을 입력해주세요.');
      return;
    }
    if (!requestForm.vendorId) {
      alert('거래처를 선택해주세요.');
      return;
    }
    if (!requestForm.unitPrice) {
      alert('단가를 입력해주세요.');
      return;
    }
    if (!requestForm.neededBy) {
      alert('필요 납기를 입력해주세요.');
      return;
    }
    const checklistComplete = Object.values(requestForm.checklist).every(Boolean);
    if (!checklistComplete) {
      alert('체크리스트를 모두 확인해주세요.');
      return;
    }
    const moq = master?.moq;
    if (moq && Number(requestForm.quantity) < moq) {
      alert(`MOQ(${moq}) 이상으로 입력해주세요.`);
      return;
    }

    snapshot();
    const request: PurchaseRequest = {
      id: crypto.randomUUID(),
      materialItemId: material.id,
      quantity: Number(requestForm.quantity),
      neededBy: requestForm.neededBy,
      vendorId: requestForm.vendorId,
      unitPrice: Number(requestForm.unitPrice),
      moq: master?.moq,
      leadTimeDays: master?.leadTimeDays,
      status: 'requested',
      checklist: requestForm.checklist,
      notes: requestForm.notes || undefined,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.username,
    };
    setRequests(prev => [request, ...prev]);
    addAuditLog('PurchaseRequest', request.id, 'create', `${material.name} 요청 생성`);
    setRequestForm({
      materialItemId: '',
      quantity: '',
      neededBy: getToday(),
      vendorId: '',
      unitPrice: '',
      notes: '',
      checklist: {
        specConfirmed: false,
        costConfirmed: false,
        quantityConfirmed: false,
        deliveryConfirmed: false,
      },
    });
  };

  const handleApprove = (requestId: string) => {
    snapshot();
    setRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? { ...r, status: 'approved', approvedAt: new Date().toISOString(), approvedBy: currentUser.username }
          : r
      )
    );
    addAuditLog('PurchaseRequest', requestId, 'approve', '승인');
  };

  const handleReject = (requestId: string) => {
    const reason = approvalNotes[requestId] || '';
    if (!reason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    snapshot();
    setRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              rejectedAt: new Date().toISOString(),
              rejectedBy: currentUser.username,
              rejectedReason: reason.trim(),
            }
          : r
      )
    );
    addAuditLog('PurchaseRequest', requestId, 'reject', reason.trim());
  };

  const handleCreatePo = (request: PurchaseRequest) => {
    snapshot();
    const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const po: PurchaseOrder = {
      id: crypto.randomUUID(),
      requestId: request.id,
      vendorId: request.vendorId || '',
      poNumber,
      status: 'ordered',
      issuedAt: new Date().toISOString(),
      issuedBy: currentUser.username,
      totalAmount: (request.unitPrice || 0) * request.quantity,
    };
    setOrders(prev => [po, ...prev]);
    setRequests(prev => prev.map(r => (r.id === request.id ? { ...r, status: 'ordered' } : r)));
    addAuditLog('PurchaseOrder', po.id, 'create', `${po.poNumber} 생성`);
  };

  const handleReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find(o => o.id === receiptForm.poId);
    if (!order) {
      alert('발주서를 선택해주세요.');
      return;
    }
    if (!receiptForm.receivedQuantity) {
      alert('입고 수량을 입력해주세요.');
      return;
    }
    snapshot();
    const receipt: GoodsReceipt = {
      id: crypto.randomUUID(),
      poId: order.id,
      receivedAt: new Date().toISOString(),
      receivedBy: currentUser.username,
      receivedQuantity: Number(receiptForm.receivedQuantity),
      defectQuantity: receiptForm.defectQuantity ? Number(receiptForm.defectQuantity) : undefined,
      inspectionNotes: receiptForm.inspectionNotes || undefined,
      photoUrls: receiptForm.photoUrls
        ? receiptForm.photoUrls.split(',').map(url => url.trim()).filter(Boolean)
        : undefined,
    };
    setReceipts(prev => [receipt, ...prev]);
    setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: 'received' } : o)));
    setRequests(prev => prev.map(r => (r.id === order.requestId ? { ...r, status: 'received' } : r)));
    addAuditLog('GoodsReceipt', receipt.id, 'create', `${order.poNumber} 입고 처리`);
    setReceiptForm({
      poId: '',
      receivedQuantity: '',
      defectQuantity: '',
      inspectionNotes: '',
      photoUrls: '',
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find(o => o.id === paymentForm.poId);
    if (!order) {
      alert('발주서를 선택해주세요.');
      return;
    }
    if (!paymentForm.invoiceNumber.trim()) {
      alert('세금계산서 번호를 입력해주세요.');
      return;
    }
    if (!paymentForm.totalAmount) {
      alert('실결제액을 입력해주세요.');
      return;
    }
    snapshot();
    const payment: InvoicePayment = {
      id: crypto.randomUUID(),
      poId: order.id,
      invoiceNumber: paymentForm.invoiceNumber.trim(),
      taxInvoiceIssued: paymentForm.taxInvoiceIssued,
      totalAmount: Number(paymentForm.totalAmount),
      paidAmount: paymentForm.paidAmount ? Number(paymentForm.paidAmount) : undefined,
      paidAt: new Date().toISOString(),
      status: paymentForm.paidAmount && Number(paymentForm.paidAmount) < Number(paymentForm.totalAmount) ? 'partial' : 'paid',
      notes: paymentForm.notes || undefined,
    };
    setPayments(prev => [payment, ...prev]);
    setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: 'settled' } : o)));
    setRequests(prev => prev.map(r => (r.id === order.requestId ? { ...r, status: 'settled' } : r)));
    addAuditLog('InvoicePayment', payment.id, 'create', `${order.poNumber} 정산`);
    setPaymentForm({
      poId: '',
      invoiceNumber: '',
      totalAmount: '',
      paidAmount: '',
      taxInvoiceIssued: false,
      notes: '',
    });
  };

  const dashboardCards = [
    { label: '지연', value: requestSummary.delayed, status: 'danger' },
    { label: '입고 예정', value: requestSummary.upcoming, status: 'info' },
    { label: '승인 대기', value: requestSummary.approvalPending, status: 'warning' },
    { label: '누락 경고', value: requestSummary.missing, status: 'danger' },
    { label: '저재고', value: requestSummary.lowStock, status: 'warning' },
  ];

  const roleHint = currentUser.role === 'admin'
    ? '관리자는 전 단계 권한을 보유합니다.'
    : '직원은 요청/입고 중심 권한을 사용합니다.';

  return (
    <div className="purchase-module">
      <div className="purchase-module-header">
        <div>
          <h2>발주 관리</h2>
          <p className="muted">{roleHint}</p>
        </div>
        <div className="purchase-module-actions">
          <button
            className="btn btn-secondary"
            onClick={handleUndo}
            disabled={!lastSnapshot}
          >
            <Undo2 size={16} />
            Undo
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => downloadCsv('purchase_requests.csv', requests.map(r => ({
              id: r.id,
              material: materialMap.get(r.materialItemId)?.name || '',
              quantity: r.quantity,
              neededBy: r.neededBy,
              status: r.status,
              vendor: vendorMap.get(r.vendorId || '')?.name || '',
              unitPrice: r.unitPrice || '',
            })))}
          >
            <Download size={16} />
            CSV
          </button>
        </div>
      </div>

      <TabNavigation
        tabs={[
          { id: 'dashboard', label: '대시보드', icon: <BarChart3 size={18} /> },
          { id: 'master', label: '부자재 마스터', icon: <ClipboardList size={18} /> },
          { id: 'request', label: '발주 요청 생성', icon: <FileText size={18} /> },
          { id: 'approval', label: '승인/반려', icon: <ClipboardCheck size={18} /> },
          { id: 'po', label: 'PO 생성/관리', icon: <PackageCheck size={18} /> },
          { id: 'receipt', label: '입고 처리', icon: <PackageCheck size={18} /> },
          { id: 'settlement', label: '정산/마감', icon: <Receipt size={18} /> },
          { id: 'audit', label: '리포트/감사로그', icon: <ClipboardList size={18} /> },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'dashboard' && (
        <div className="purchase-dashboard">
          <div className="purchase-dashboard-cards">
            {dashboardCards.map(card => (
              <div key={card.label} className={`purchase-card ${card.status}`}>
                <span className="purchase-card-label">{card.label}</span>
                <strong className="purchase-card-value">{card.value}</strong>
              </div>
            ))}
          </div>
          <div className="purchase-dashboard-note">
            <p>상태 흐름은 요청 → 승인 → 발주완료 → 입고 → 정산완료를 따릅니다.</p>
          </div>
        </div>
      )}

      {activeTab === 'master' && (
        <div className="purchase-section">
          <form className="purchase-form" onSubmit={handleMasterSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>부자재 *</label>
                <select
                  className="form-select"
                  value={masterForm.materialItemId}
                  onChange={(e) => setMasterForm(prev => ({ ...prev, materialItemId: e.target.value }))}
                >
                  <option value="">선택</option>
                  {materialItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>단위 *</label>
                <input
                  type="text"
                  value={masterForm.unit}
                  onChange={(e) => setMasterForm(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>MOQ</label>
                <input
                  type="number"
                  value={masterForm.moq}
                  onChange={(e) => setMasterForm(prev => ({ ...prev, moq: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>리드타임(일)</label>
                <input
                  type="number"
                  value={masterForm.leadTimeDays}
                  onChange={(e) => setMasterForm(prev => ({ ...prev, leadTimeDays: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>ROP</label>
                <input
                  type="number"
                  value={masterForm.reorderPoint}
                  onChange={(e) => setMasterForm(prev => ({ ...prev, reorderPoint: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>최근 단가</label>
                <input
                  type="number"
                  value={masterForm.unitPrice}
                  onChange={(e) => setMasterForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">
              마스터 저장
            </button>
          </form>

          <div className="purchase-table">
            <div className="purchase-table-header">
              <span>부자재</span>
              <span>단위</span>
              <span>MOQ</span>
              <span>리드타임</span>
              <span>ROP</span>
              <span>최근 단가</span>
            </div>
            {materialMasters.length === 0 ? (
              <div className="empty-state">등록된 마스터가 없습니다.</div>
            ) : (
              materialMasters.map(master => {
                const material = materialMap.get(master.materialItemId);
                const latestPrice = master.priceHistory?.[master.priceHistory.length - 1];
                return (
                  <div key={master.id} className="purchase-table-row">
                    <span>{material?.name || '알 수 없음'}</span>
                    <span>{master.unit}</span>
                    <span>{master.moq ?? '-'}</span>
                    <span>{master.leadTimeDays ?? '-'}</span>
                    <span>{master.reorderPoint ?? '-'}</span>
                    <span>{latestPrice ? `${latestPrice.price.toLocaleString()}원` : '-'}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'request' && (
        <div className="purchase-section">
          <form className="purchase-form" onSubmit={handleRequestSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>부자재 *</label>
                <select
                  className="form-select"
                  value={requestForm.materialItemId}
                  onChange={(e) => {
                    const materialItemId = e.target.value;
                    const master = masterMap.get(materialItemId);
                    setRequestForm(prev => ({
                      ...prev,
                      materialItemId,
                      unitPrice: master?.priceHistory?.[master.priceHistory.length - 1]?.price?.toString() || '',
                    }));
                  }}
                >
                  <option value="">선택</option>
                  {materialItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>수량 *</label>
                <input
                  type="number"
                  value={requestForm.quantity}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>납기 *</label>
                <input
                  type="date"
                  value={requestForm.neededBy}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, neededBy: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>거래처 *</label>
                <select
                  className="form-select"
                  value={requestForm.vendorId}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, vendorId: e.target.value }))}
                >
                  <option value="">선택</option>
                  {vendors.filter(v => v.active).map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>단가 *</label>
                <input
                  type="number"
                  value={requestForm.unitPrice}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>메모</label>
                <input
                  type="text"
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="purchase-checklist">
              {([
                ['specConfirmed', '사양 확인'],
                ['costConfirmed', '단가 확인'],
                ['quantityConfirmed', '수량 확인'],
                ['deliveryConfirmed', '납기 확인'],
              ] as const).map(([key, label]) => (
                <label key={key} className="checklist-item">
                  <input
                    type="checkbox"
                    checked={requestForm.checklist[key]}
                    onChange={(e) =>
                      setRequestForm(prev => ({
                        ...prev,
                        checklist: { ...prev.checklist, [key]: e.target.checked },
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <button className="btn btn-primary" type="submit">
              요청 등록
            </button>
          </form>

          <div className="purchase-table">
            <div className="purchase-table-header">
              <span>부자재</span>
              <span>수량</span>
              <span>납기</span>
              <span>거래처</span>
              <span>상태</span>
            </div>
            {requests.length === 0 ? (
              <div className="empty-state">요청 내역이 없습니다.</div>
            ) : (
              requests.map(request => (
                <div key={request.id} className="purchase-table-row">
                  <span>{materialMap.get(request.materialItemId)?.name || '알 수 없음'}</span>
                  <span>{request.quantity.toLocaleString()}</span>
                  <span>{request.neededBy}</span>
                  <span>{vendorMap.get(request.vendorId || '')?.name || '-'}</span>
                  <span>{request.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'approval' && (
        <div className="purchase-section">
          {requests.filter(r => r.status === 'requested').length === 0 ? (
            <div className="empty-state">승인 대기 요청이 없습니다.</div>
          ) : (
            requests.filter(r => r.status === 'requested').map(request => (
              <div key={request.id} className="purchase-card-row">
                <div>
                  <strong>{materialMap.get(request.materialItemId)?.name || '알 수 없음'}</strong>
                  <p className="muted">수량 {request.quantity} · 납기 {request.neededBy}</p>
                </div>
                <div className="purchase-card-actions">
                  <input
                    type="text"
                    placeholder="반려 사유"
                    value={approvalNotes[request.id] || ''}
                    onChange={(e) => setApprovalNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                  />
                  <button className="btn btn-secondary" onClick={() => handleReject(request.id)}>
                    반려
                  </button>
                  <button className="btn btn-primary" onClick={() => handleApprove(request.id)}>
                    승인
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'po' && (
        <div className="purchase-section">
          {requests.filter(r => r.status === 'approved').length === 0 ? (
            <div className="empty-state">PO 생성 대상이 없습니다.</div>
          ) : (
            requests
              .filter(r => r.status === 'approved')
              .map(request => (
                <div key={request.id} className="purchase-card-row">
                  <div>
                    <strong>{materialMap.get(request.materialItemId)?.name || '알 수 없음'}</strong>
                    <p className="muted">수량 {request.quantity} · 거래처 {vendorMap.get(request.vendorId || '')?.name || '-'}</p>
                  </div>
                  <div className="purchase-card-actions">
                    <button className="btn btn-primary" onClick={() => handleCreatePo(request)}>
                      PO 생성
                    </button>
                  </div>
                </div>
              ))
          )}

          <div className="purchase-table">
            <div className="purchase-table-header">
              <span>PO 번호</span>
              <span>거래처</span>
              <span>금액</span>
              <span>상태</span>
            </div>
            {orders.length === 0 ? (
              <div className="empty-state">생성된 PO가 없습니다.</div>
            ) : (
              orders.map(po => (
                <div key={po.id} className="purchase-table-row">
                  <span>{po.poNumber}</span>
                  <span>{vendorMap.get(po.vendorId)?.name || '-'}</span>
                  <span>{po.totalAmount.toLocaleString()}원</span>
                  <span>{po.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'receipt' && (
        <div className="purchase-section">
          <form className="purchase-form" onSubmit={handleReceiptSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>PO 선택 *</label>
                <select
                  className="form-select"
                  value={receiptForm.poId}
                  onChange={(e) => setReceiptForm(prev => ({ ...prev, poId: e.target.value }))}
                >
                  <option value="">선택</option>
                  {orders.filter(po => statusFlow.includes(po.status)).map(po => (
                    <option key={po.id} value={po.id}>{po.poNumber}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>입고 수량 *</label>
                <input
                  type="number"
                  value={receiptForm.receivedQuantity}
                  onChange={(e) => setReceiptForm(prev => ({ ...prev, receivedQuantity: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>불량 수량</label>
                <input
                  type="number"
                  value={receiptForm.defectQuantity}
                  onChange={(e) => setReceiptForm(prev => ({ ...prev, defectQuantity: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>검수 메모</label>
                <input
                  type="text"
                  value={receiptForm.inspectionNotes}
                  onChange={(e) => setReceiptForm(prev => ({ ...prev, inspectionNotes: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>사진 URL (쉼표 구분)</label>
                <input
                  type="text"
                  value={receiptForm.photoUrls}
                  onChange={(e) => setReceiptForm(prev => ({ ...prev, photoUrls: e.target.value }))}
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">
              입고 처리
            </button>
          </form>

          <div className="purchase-table">
            <div className="purchase-table-header">
              <span>PO 번호</span>
              <span>입고 수량</span>
              <span>불량</span>
              <span>처리자</span>
            </div>
            {receipts.length === 0 ? (
              <div className="empty-state">입고 기록이 없습니다.</div>
            ) : (
              receipts.map(receipt => {
                const po = orders.find(o => o.id === receipt.poId);
                return (
                  <div key={receipt.id} className="purchase-table-row">
                    <span>{po?.poNumber || '-'}</span>
                    <span>{receipt.receivedQuantity}</span>
                    <span>{receipt.defectQuantity ?? '-'}</span>
                    <span>{receipt.receivedBy}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'settlement' && (
        <div className="purchase-section">
          <form className="purchase-form" onSubmit={handlePaymentSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>PO 선택 *</label>
                <select
                  className="form-select"
                  value={paymentForm.poId}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, poId: e.target.value }))}
                >
                  <option value="">선택</option>
                  {orders.filter(po => po.status === 'received').map(po => (
                    <option key={po.id} value={po.id}>{po.poNumber}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>세금계산서 번호 *</label>
                <input
                  type="text"
                  value={paymentForm.invoiceNumber}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>실결제액 *</label>
                <input
                  type="number"
                  value={paymentForm.totalAmount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>지급액</label>
                <input
                  type="number"
                  value={paymentForm.paidAmount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paidAmount: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>비고</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={paymentForm.taxInvoiceIssued}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, taxInvoiceIssued: e.target.checked }))}
                  />
                  세금계산서 발행
                </label>
              </div>
            </div>
            <button className="btn btn-primary" type="submit">
              정산 처리
            </button>
          </form>

          <div className="purchase-table">
            <div className="purchase-table-header">
              <span>PO 번호</span>
              <span>세금계산서</span>
              <span>실결제액</span>
              <span>상태</span>
            </div>
            {payments.length === 0 ? (
              <div className="empty-state">정산 데이터가 없습니다.</div>
            ) : (
              payments.map(payment => {
                const po = orders.find(o => o.id === payment.poId);
                return (
                  <div key={payment.id} className="purchase-table-row">
                    <span>{po?.poNumber || '-'}</span>
                    <span>{payment.invoiceNumber}</span>
                    <span>{payment.totalAmount.toLocaleString()}원</span>
                    <span>{payment.status}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="purchase-section">
          <div className="purchase-table">
            <div className="purchase-table-header">
              <span>시간</span>
              <span>유형</span>
              <span>액션</span>
              <span>상세</span>
            </div>
            {auditLogs.length === 0 ? (
              <div className="empty-state">감사 로그가 없습니다.</div>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="purchase-table-row">
                  <span>{new Date(log.createdAt).toLocaleString('ko-KR')}</span>
                  <span>{log.entityType}</span>
                  <span>{log.action}</span>
                  <span>{log.detail || '-'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
