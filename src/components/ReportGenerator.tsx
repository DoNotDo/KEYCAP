import { useState } from 'react';
import { ReportData, ReportPeriod, Order, ConsumptionRecord, InventoryItem } from '../types';
import { Download } from 'lucide-react';
import { X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportGeneratorProps {
  orders: Order[];
  consumptions: ConsumptionRecord[];
  items: InventoryItem[];
  onClose: () => void;
}

export const ReportGenerator = ({ orders, consumptions, items, onClose }: ReportGeneratorProps) => {
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const generateReport = (): ReportData => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.processedAt || order.orderDate);
      return orderDate >= start && orderDate <= end && order.status === 'completed';
    });

    const filteredConsumptions = consumptions.filter(cons => {
      const consDate = new Date(cons.processedAt);
      return consDate >= start && consDate <= end;
    });

    const finishedItemMap = new Map<string, { name: string; quantity: number }>();
    const materialMap = new Map<string, { name: string; quantity: number }>();

    filteredConsumptions.forEach(cons => {
      const item = items.find(i => i.id === cons.itemId);
      if (!item) return;

      if (cons.itemType === 'finished') {
        const existing = finishedItemMap.get(cons.itemId);
        finishedItemMap.set(cons.itemId, {
          name: item.name,
          quantity: (existing?.quantity || 0) + cons.quantity,
        });
      } else {
        const existing = materialMap.get(cons.itemId);
        materialMap.set(cons.itemId, {
          name: item.name,
          quantity: (existing?.quantity || 0) + cons.quantity,
        });
      }
    });

    return {
      period,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      orders: filteredOrders,
      consumptions: filteredConsumptions,
      finishedItemConsumptions: Array.from(finishedItemMap.entries()).map(([itemId, data]) => ({ itemId, itemName: data.name, totalQuantity: data.quantity })),
      materialConsumptions: Array.from(materialMap.entries()).map(([itemId, data]) => ({ itemId, itemName: data.name, totalQuantity: data.quantity })),
      totalOrders: filteredOrders.length,
      totalFinishedItemsConsumed: Array.from(finishedItemMap.values()).reduce((sum, item) => sum + item.quantity, 0),
      totalMaterialsConsumed: Array.from(materialMap.values()).reduce((sum, item) => sum + item.quantity, 0),
    };
  };

  const handleGenerate = () => {
    const report = generateReport();
    downloadReport(report, period, startDate, endDate);
  };

  const downloadReport = (report: ReportData, period: ReportPeriod, start: string, end: string) => {
    const periodName = period === 'week' ? '주간' : '월간';
    const summaryRows = [
      { 항목: '보고서 유형', 값: periodName },
      { 항목: '기간', 값: `${new Date(report.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(report.endDate).toLocaleDateString('ko-KR')}` },
      { 항목: '총 발주 건수', 값: report.totalOrders },
      { 항목: '총 완성재고 소모', 값: report.totalFinishedItemsConsumed },
      { 항목: '총 부자재 소모', 값: report.totalMaterialsConsumed },
    ];

    const orderRows = report.orders.map(order => {
      const finishedItem = items.find(i => i.id === order.finishedItemId);
      const completionRate = order.shippedQuantity && order.quantity > 0 ? Math.round((order.shippedQuantity / order.quantity) * 100) : null;
      return {
        지점: order.branchName,
        품목: finishedItem?.name || '알 수 없음',
        요청수량: order.quantity,
        출고수량: order.shippedQuantity || '',
        완성도: completionRate ? `${completionRate}%` : '',
        주문일: order.orderDate ? new Date(order.orderDate).toLocaleDateString('ko-KR') : '',
        출고일: order.shippedAt ? new Date(order.shippedAt).toLocaleDateString('ko-KR') : '',
      };
    });

    const finishedRows = report.finishedItemConsumptions.map(item => ({ 품목: item.itemName, 소모수량: item.totalQuantity }));
    const materialRows = report.materialConsumptions.map(item => ({ 품목: item.itemName, 소모수량: item.totalQuantity }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), '요약');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(orderRows), '발주내역');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(finishedRows), '완성재고소모');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(materialRows), '부자재소모');

    XLSX.writeFile(wb, `${periodName}_보고서_${start}_${end}.xlsx`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>보고서 생성</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="report-generator-content">
          <div className="form-group">
            <label>보고서 유형 *</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value as ReportPeriod)} className="form-select">
              <option value="week">주간 보고서</option>
              <option value="month">월간 보고서</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>시작일 *</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>종료일 *</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">취소</button>
            <button onClick={handleGenerate} className="btn btn-primary"><Download size={18} /> 엑셀 다운로드</button>
          </div>
        </div>
      </div>
    </div>
  );
};
