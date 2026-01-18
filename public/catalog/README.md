# 카탈로그 폴더 구조

`public/catalog/items.json`에 상품 기본 정보를 넣고 `public/catalog/images/`에 이미지를 넣으면
앱에서 카탈로그 동기화를 통해 재고 항목으로 자동 등록합니다.

## items.json 형식
```
[
  {
    "sku": "MAT-001",
    "name": "스위치 스템",
    "category": "스위치",
    "type": "material",
    "unit": "개",
    "price": 120,
    "minQuantity": 1000,
    "maxQuantity": 5000,
    "imageUrl": "/catalog/images/mat-001.png",
    "description": "표준 스위치 스템",
    "location": "A-01"
  }
]
```

## 이미지 폴더
- `public/catalog/images/`에 파일 추가
- `imageUrl`에는 `/catalog/images/파일명` 형태로 입력
