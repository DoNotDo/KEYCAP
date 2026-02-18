import { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { BRANCH_LIST } from '../constants/branches';
import { MapPin, Copy, Check } from 'lucide-react';

interface BranchStockReportProps {
  items: InventoryItem[];
  /** 추가로 표시할 지점(orders 등에서 추출된 지점). BRANCH_LIST와 합쳐서 사용 */
  extraBranchNames?: string[];
  /** 직원인 경우 자신의 지점만 선택 가능 */
  currentUserBranch?: string | null;
}

/** 품목명에서 대표명과 옵션(색상 등) 분리. "동전 파우치 - 빨강" → { base: "동전 파우치", variant: "빨강" } */
function parseName(name: string): { base: string; variant: string } {
  const idx = name.indexOf(' - ');
  if (idx >= 0) {
    return { base: name.slice(0, idx).trim(), variant: name.slice(idx + 3).trim() };
  }
  return { base: name, variant: '' };
}

/** 카테고리별 → 대표명별 → 옵션별 수량 그룹 */
function groupByCategoryAndBase(
  items: InventoryItem[]
): Map<string, Map<string, { variant: string; quantity: number }[]>> {
  const byCategory = new Map<string, Map<string, { variant: string; quantity: number }[]>>();
  for (const item of items) {
    const cat = item.category || '기타';
    const { base, variant } = parseName(item.name);
    if (!byCategory.has(cat)) {
      byCategory.set(cat, new Map());
    }
    const byBase = byCategory.get(cat)!;
    const key = base || item.name;
    if (!byBase.has(key)) {
      byBase.set(key, []);
    }
    const list = byBase.get(key)!;
    if (variant) {
      list.push({ variant, quantity: item.quantity });
    } else {
      list.push({ variant: '', quantity: item.quantity });
    }
  }
  return byCategory;
}

/** 카톡용 한 줄 텍스트 생성: "빨강 2/주황 2/노랑 2" 또는 단일 수량 "5" */
function formatVariantsLine(entries: { variant: string; quantity: number }[]): string {
  const withVariant = entries.filter(e => e.variant);
  if (withVariant.length === 0) {
    const sum = entries.reduce((s, e) => s + e.quantity, 0);
    return String(sum);
  }
  return withVariant.map(e => `${e.variant} ${e.quantity}`).join('/');
}

export function BranchStockReport({
  items,
  extraBranchNames = [],
  currentUserBranch,
}: BranchStockReportProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    if (currentUserBranch) return currentUserBranch;
    return BRANCH_LIST[0] ?? '본사';
  });
  const [copied, setCopied] = useState(false);

  const branches = useMemo(() => {
    const set = new Set<string>([...BRANCH_LIST, ...extraBranchNames]);
    return Array.from(set).sort((a, b) => {
      if (a === '본사') return -1;
      if (b === '본사') return 1;
      return a.localeCompare(b);
    });
  }, [extraBranchNames]);

  const filteredItems = useMemo(() => {
    return items.filter(item => (item.branchName || '본사') === selectedBranch);
  }, [items, selectedBranch]);

  const grouped = useMemo(() => groupByCategoryAndBase(filteredItems), [filteredItems]);

  const copyKakaoText = () => {
    const lines: string[] = [];
    const dateStr = new Date().toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }).replace(/요일$/, '').trim();
    lines.push(`${dateStr} / ${selectedBranch}`);
    lines.push('');

    grouped.forEach((byBase, category) => {
      lines.push(`< ${category} >`);
      byBase.forEach((variants, baseName) => {
        const line = formatVariantsLine(variants);
        if (line) {
          lines.push(`${baseName}`);
          lines.push(line);
        }
      });
      lines.push('');
    });
    lines.push(`- ${selectedBranch}`);

    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const displayBranches = currentUserBranch ? branches.filter(b => b === currentUserBranch) : branches;

  return (
    <div className="branch-stock-report">
      <h2>지점별 재고 보고</h2>
      <p className="branch-stock-report-desc">
        지점을 선택하면 해당 지점 재고를 카톡에 붙여넣기 좋은 형식으로 볼 수 있습니다. 「카톡용 텍스트 복사」로 복사 후 그룹 채팅에 붙여넣으세요.
      </p>
      <div className="branch-stock-report-controls">
        <label className="branch-select-label">
          <MapPin size={18} />
          지점
        </label>
        <select
          className="form-select branch-select"
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
        >
          {displayBranches.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary"
          onClick={copyKakaoText}
          disabled={filteredItems.length === 0}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? '복사됨' : '카톡용 텍스트 복사'}
        </button>
      </div>
      <div className="branch-stock-report-content">
        {filteredItems.length === 0 ? (
          <p className="empty-state">이 지점에 등록된 재고가 없습니다. 재고 추가 시 지점을 선택해 두면 여기서 집계됩니다.</p>
        ) : (
          <div className="branch-stock-groups">
            {Array.from(grouped.entries()).map(([category, byBase]) => (
              <div key={category} className="branch-stock-category">
                <h3>&lt; {category} &gt;</h3>
                <ul>
                  {Array.from(byBase.entries()).map(([baseName, variants]) => {
                    const line = formatVariantsLine(variants);
                    return (
                      <li key={baseName}>
                        <span className="base-name">{baseName}</span>
                        <span className="variant-line">{line}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
