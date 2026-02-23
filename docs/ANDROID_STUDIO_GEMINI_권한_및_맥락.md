# Android Studio + Gemini 작업 이어가기 — 권한 및 프로젝트 맥락

이 문서는 **KEYCAPS 프로젝트**를 Android Studio에서 **Gemini**가 이어서 개발할 때 사용하는 권한·맥락 설명입니다.  
프로젝트 소유자(사용자)가 **Gemini에게 동일한 작업을 Android 앱으로 이어가도록 권한을 부여**합니다.

---

## 1. 권한 및 범위

- **허용 내용**: KEYCAPS 재고 관리 시스템을 **Android 앱**으로 구현·확장하는 작업을 Gemini가 진행해도 됩니다.
- **기존 웹 앱**: Cursor와 함께 진행한 React(Vite) + Firebase 웹 버전과 **동일한 Firebase 프로젝트·데이터**를 사용합니다. 웹과 Android가 같은 데이터를 공유합니다.
- **참고 허용**: 이 저장소의 코드, 문서, 데이터 구조, 비즈니스 로직을 참고·이식·수정하는 것을 허용합니다.

---

## 2. Firebase 프로젝트 (그대로 사용)

| 항목 | 값 |
|------|-----|
| **Project ID** | `management-9f7d8` |
| **웹 앱 URL** | https://management-9f7d8.web.app |
| **Auth** | Firebase Authentication (이메일/비밀번호) |
| **DB** | Firestore |

Android 앱을 같은 프로젝트(`management-9f7d8`)에 등록하고, **동일한 Firestore·Auth**를 사용하면 웹과 데이터가 맞습니다.

---

## 3. Firestore 컬렉션 및 데이터 구조

웹 앱과 동일한 컬렉션을 Android에서도 사용합니다.

| 컬렉션 | 용도 |
|--------|------|
| `items` | 재고 품목 (완성재고·부자재, 지점별) |
| `transactions` | 입출고 거래 내역 |
| `bom` | BOM(완성재고별 부자재 구성) |
| `orders` | 지점 주문 (상태: pending → processing → shipping → received → completed) |
| `consumptions` | 소모 내역 (출고 처리 시 기록) |
| `materialOrders` | 부자재 발주 |
| `branchNotes` | 지점별 특이사항 메모 |

### 3.1 핵심 타입 요약 (웹 `src/types.ts` 기준)

- **InventoryItem**: id, name, sku, category, type('finished'|'material'), **branchName**, quantity, minQuantity, maxQuantity, unit, price, location, description, createdAt, updatedAt
- **Order**: id, **branchName**, finishedItemId, quantity, orderDate, **status**, processedAt, shippedAt, receivedAt, shippedQuantity 등
- **BOMItem**: finishedItemId, materialItemId, quantity
- **User/권한**: role('admin'|'employee'), **branchName**(직원은 해당 지점만)

지점별 재고·주문·보고는 모두 **branchName**으로 구분됩니다.

---

## 4. 반드시 유지할 기능·비즈니스 로직

Android에서도 아래와 동일한 개념으로 이어가면 됩니다.

1. **지점별 재고**
   - 품목에 `branchName` 지정, 지점별 필터링.
2. **와펜·키캡 지점별 보고**
   - 카테고리별 그룹, 품목명은 `이름 - 옵션(색상)` 형식 권장.  
   - 상세: `docs/와펜키캡_재고보고_가이드.md` 참고.
3. **지점 목록**
   - 본사, 평촌, 천안, 마곡, 영등포, 일산, 가든, 청량리, 건대, 목동, 판교, 광교, 강남, 수원, 동탄, 부산 서면, 부산 센텀, 울산 (웹: `src/constants/branches.ts`).
4. **BOM 기반 부자재 소모**
   - 지점 주문 출고 시, 완성재고 BOM에 따라 부자재 소모량 자동 계산·기록.
5. **권한**
   - admin: 전체 지점, 직원(employee): 자신의 `branchName`만 접근.

---

## 5. Android Studio에서 할 일 (Gemini 작업 범위)

- **같은 Firebase 프로젝트**에 Android 앱 등록, `google-services.json` 적용.
- **Firestore·Auth** 규칙은 웹과 동일하게 사용 (필요 시 보안 규칙만 문서 참고).
- 위 3·4절의 컬렉션·타입·지점 목록·보고 규칙을 Android 코드(Kotlin/Java 데이터 클래스·모델)에 맞게 이식.
- 지점별 재고 조회, 지점별 재고 보고(카톡용 텍스트 생성), 출고 처리, BOM 소모 계산 등 **로직을 웹과 동일한 규칙으로** 구현.

---

## 6. 참고 문서 (이 저장소 내)

- **와펜·키캡 재고 보고**: `docs/와펜키캡_재고보고_가이드.md`
- **지점 목록 상수**: `src/constants/branches.ts`
- **타입 정의**: `src/types.ts`
- **Firestore 사용 예**: `src/utils/storage.ts` (컬렉션 이름·캐시·실시간 구독 등)

---

## 7. 요약

- **권한**: 사용자가 Gemini에게 KEYCAPS를 Android Studio에서 이어서 개발할 권한을 부여함.
- **동일 프로젝트**: Firebase `management-9f7d8`, 동일 Firestore·Auth 사용.
- **동일 규칙**: 지점별 재고, 와펜/키캡 보고 형식, BOM·출고 로직, 권한(admin/employee·branchName) 유지.

Android Studio에서 이 문서를 Gemini에게 보여주고, “이 권한과 맥락으로 KEYCAPS Android 앱을 이어서 만들어줘”라고 요청하면 됩니다.
