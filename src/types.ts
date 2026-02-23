export type ItemType = 'finished' | 'material'; // 완성재고 | 부자재

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string; // 상품 코드/번호
  imageUrl?: string; // 이미지 URL
  category: string;
  type: ItemType; // 재고 타입 추가
  branchName?: string; // 지점별 재고 구분
  betaProductId?: string; // 완성재고만: 주간보고 품목(BetaProduct)과 연동
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unit: string;
  price: number;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// BOM (Bill of Materials) - 완성재고 생산에 필요한 부자재 정보
export interface BOMItem {
  id: string;
  finishedItemId: string; // 완성재고 ID
  materialItemId: string; // 부자재 ID
  quantity: number; // 완성재고 1개당 필요한 부자재 수량
}

// 지점 주문/수요 정보
export interface Order {
  id: string;
  branchName: string; // 지점명
  finishedItemId: string; // 완성재고 ID
  quantity: number; // 주문 수량
  orderDate: string;
  status: 'pending' | 'processing' | 'shipping' | 'received' | 'completed' | 'rejected';
  createdAt: string;
  processedAt?: string; // 처리 일시
  processedBy?: string; // 처리자
  notes?: string; // 처리 메모
  shippedAt?: string; // 출고 일시
  shippedBy?: string; // 출고 처리자
  receivedAt?: string; // 입고 일시
  receivedBy?: string; // 입고 처리자
  shippedQuantity?: number; // 출고된 수량
}

// 부자재 발주 상태
export type MaterialOrderStatus = 'planned' | 'ordered' | 'partial' | 'received' | 'cancelled';

// 부자재 발주 내역
export interface MaterialOrder {
  id: string;
  materialItemId: string;
  category: string;
  quantity: number;
  receivedQuantity?: number;
  status: MaterialOrderStatus;
  orderDate: string;
  expectedDate?: string;
  receivedAt?: string; // 실제 입고일
  nextOrderDate?: string;
  supplier?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

// 부자재 소모량 계산 결과
export interface MaterialConsumption {
  materialItemId: string;
  materialName: string;
  requiredQuantity: number; // 필요한 수량
  availableQuantity: number; // 현재 재고
  shortage: number; // 부족량 (음수면 부족)
  isShortage: boolean; // 부족 여부
}

export interface Transaction {
  id: string;
  itemId: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  timestamp: string;
  userId?: string;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  recentTransactions: number;
  finishedItems: number;
  materialItems: number;
  pendingOrders: number;
}

// 사용자 및 인증
export type UserRole = 'admin' | 'employee';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  username: string;
  password: string; // 실제로는 해시되어야 함
  role: UserRole;
  branchName?: string; // 직원의 경우 할당된 지점
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// 지점별 재고 부족 정보
export interface BranchShortage {
  branchName: string;
  shortages: Array<{
    materialItemId: string;
    materialName: string;
    requiredQuantity: number;
    availableQuantity: number;
    shortage: number;
  }>;
  orders: Order[];
  totalShortageCount: number;
}

// 지점 특이사항/요청사항
export interface BranchNote {
  id: string;
  branchName: string;
  notes: string;
  updatedAt: string;
  updatedBy?: string;
}

// 소모 내역 (발주 처리 시 기록)
export interface ConsumptionRecord {
  id: string;
  orderId: string;
  itemId: string; // 완성재고 또는 부자재 ID
  itemType: 'finished' | 'material';
  quantity: number; // 소모된 수량
  branchName: string;
  orderDate: string;
  processedAt: string;
  processedBy: string;
  finishedItemId?: string; // 부자재인 경우 어떤 완성재고에 쓰였는지
}

// 보고서 기간 타입
export type ReportPeriod = 'week' | 'month';

// 보고서 데이터
export interface ReportData {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  orders: Order[];
  consumptions: ConsumptionRecord[];
  finishedItemConsumptions: Array<{
    itemId: string;
    itemName: string;
    totalQuantity: number;
  }>;
  materialConsumptions: Array<{
    itemId: string;
    itemName: string;
    totalQuantity: number;
  }>;
  totalOrders: number;
  totalFinishedItemsConsumed: number;
  totalMaterialsConsumed: number;
}

// ========== 베타 테스트 ==========
/** 관리 가능한 지점 (어드민 CRUD) */
export interface BetaBranch {
  id: string;
  name: string;
  order: number;
  active: boolean;
}

/** 베타 품목 카테고리 (10개, 어드민 CRUD) */
export interface BetaCategory {
  id: string;
  name: string;
  order: number;
}

/** 베타 품목 (카테고리당 10개, 어드민 CRUD) */
export interface BetaProduct {
  id: string;
  categoryId: string;
  name: string;
  order: number;
}

/** 주간 재고 수준 0~10, 선택적 주간 판매수량 */
export interface BetaWeeklyReport {
  id: string;
  branchName: string;
  weekKey: string; // "2026-W08"
  levels: Record<string, number>; // productId -> 0~10
  sales?: Record<string, number>; // productId -> 판매수량
  reportedAt: string;
  reportedBy?: string;
}

/** 생산 계획 1품목: 수요 - 완성재고 = 생산개수 */
export interface ProductionPlanItem {
  productId: string;
  productName: string;
  categoryName: string;
  demand: number;   // 주간보고 기반 수요
  finishedStock: number;
  productionQty: number; // max(0, demand - finishedStock)
  finishedItemId?: string; // BOM 매핑용
}

/** 부자재 소요 (생산계획 기반 자동 산출) */
export interface MaterialRequirement {
  materialItemId: string;
  materialName: string;
  requiredQty: number;
  currentStock: number;
  shortage: number;
}

/** 발주 요청서 항목 (자동 생성용) */
export interface OrderRequestItem {
  materialItemId: string;
  materialName: string;
  quantity: number;
  reason?: string;
}
