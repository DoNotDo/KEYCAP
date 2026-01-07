import { useState } from 'react';
import { ReportData, ReportPeriod, Order, ConsumptionRecord, InventoryItem } from '../types';
import { FileText, Download, Calendar } from 'lucide-react';
import { X } from 'lucide-react';

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
      finishedItemConsumptions: Array.from(finishedItemMap.entries()).map(([itemId, data]) => ({
        itemId,
        itemName: data.name,
        totalQuantity: data.quantity,
      })),
      materialConsumptions: Array.from(materialMap.entries()).map(([itemId, data]) => ({
        itemId,
        itemName: data.name,
        totalQuantity: data.quantity,
      })),
      totalOrders: filteredOrders.length,
      totalFinishedItemsConsumed: Array.from(finishedItemMap.values()).reduce((sum, item) => sum + item.quantity, 0),
      totalMaterialsConsumed: Array.from(materialMap.values()).reduce((sum, item) => sum + item.quantity, 0),
    };
  };

  const handleGenerate = () => {
    const report = generateReport();
    const reportText = formatReport(report);
    downloadReport(reportText, period, startDate, endDate);
  };

  const formatReport = (report: ReportData): string => {
    const periodName = report.period === 'week' ? '주간' : '월간';
    let text = `=== ${periodName} 보고서 ===\n`;
    text += `기간: ${new Date(report.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(report.endDate).toLocaleDateString('ko-KR')}\n\n`;
    text += `총 발주 건수: ${report.totalOrders}건\n`;
    text += `총 완성재고 소모: ${report.totalFinishedItemsConsumed}개\n`;
    text += `총 부자재 소모: ${report.totalMaterialsConsumed}개\n\n`;
    
    // 발주 내역 상세 (완성도 포함)
    text += `--- 발주 내역 상세 ---\n`;
    report.orders.forEach(order => {
      const finishedItem = items.find(i => i.id === order.finishedItemId);
      const completionRate = order.shippedQuantity && order.quantity > 0 
        ? Math.round((order.shippedQuantity / order.quantity) * 100)
        : null;
      text += `[${order.branchName}] ${finishedItem?.name || '알 수 없음'}\n`;
      text += `  요청: ${order.quantity}개`;
      if (order.shippedQuantity) {
        text += ` | 출고: ${order.shippedQuantity}개`;
        if (completionRate !== null) {
          text += ` (완성도: ${completionRate}%)`;
        }
      }
      text += `\n`;
      text += `  주문일: ${new Date(order.orderDate).toLocaleDateString('ko-KR')}\n`;
      if (order.shippedAt) {
        text += `  출고일: ${new Date(order.shippedAt).toLocaleDateString('ko-KR')}\n`;
      }
      text += `\n`;
    });
    
    text += `--- 완성재고 소모 내역 ---\n`;
    report.finishedItemConsumptions.forEach(item => {
      text += `${item.itemName}: ${item.totalQuantity}개\n`;
    });
    
    text += `\n--- 부자재 소모 내역 ---\n`;
    report.materialConsumptions.forEach(item => {
      text += `${item.itemName}: ${item.totalQuantity}개\n`;
    });
    
    return text;
  };

  const downloadReport = (content: string, period: ReportPeriod, start: string, end: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${period === 'week' ? '주간' : '월간'}_보고서_${start}_${end}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>보고서 생성</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="report-generator-content">
          <div className="form-group">
            <label>보고서 유형 *</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
              className="form-select"
            >
              <option value="week">주간 보고서</option>
              <option value="month">월간 보고서</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>시작일 *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>종료일 *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              취소
            </button>
            <button onClick={handleGenerate} className="btn btn-primary">
              <Download size={18} />
              보고서 다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
