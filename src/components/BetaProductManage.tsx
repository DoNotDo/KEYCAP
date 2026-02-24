import { useState } from 'react';
import { BetaCategory, BetaProduct } from '../types';
import { storage } from '../utils/storage';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface BetaProductManageProps {
  categories: BetaCategory[];
  products: BetaProduct[];
  productsByCategory: Map<string, BetaProduct[]>;
}

export function BetaProductManage(props: BetaProductManageProps) {
  const { categories, productsByCategory } = props;
  const [expandedCat, setExpandedCat] = useState<string | null>(categories[0]?.id ?? null);
  const [editingCategory, setEditingCategory] = useState<BetaCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<BetaProduct | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
  const [name, setName] = useState('');
  void props.products;

  const handleSaveCategory = async () => {
    if (!editingCategory || !name.trim()) return;
    await storage.updateBetaCategory(editingCategory.id, { name: name.trim(), order: editingCategory.order });
    setEditingCategory(null);
    setName('');
  };

  const handleAddCategory = async () => {
    if (!name.trim()) return;
    await storage.addBetaCategory({ name: name.trim(), order: categories.length });
    setAddingCategory(false);
    setName('');
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !name.trim()) return;
    await storage.updateBetaProduct(editingProduct.id, { name: name.trim(), order: editingProduct.order });
    setEditingProduct(null);
    setName('');
  };

  const handleAddProduct = async (categoryId: string) => {
    if (!name.trim()) return;
    const list = productsByCategory.get(categoryId) || [];
    await storage.addBetaProduct({ categoryId, name: name.trim(), order: list.length });
    setAddingProduct(null);
    setName('');
  };

  const handleDeleteCategory = async (c: BetaCategory) => {
    if (!confirm(`"${c.name}" 카테고리와 하위 품목을 모두 삭제할까요?`)) return;
    await storage.deleteBetaCategory(c.id);
    setExpandedCat(categories.find(x => x.id !== c.id)?.id ?? null);
  };

  const handleDeleteProduct = async (p: BetaProduct) => {
    if (!confirm(`"${p.name}" 품목을 삭제할까요?`)) return;
    await storage.deleteBetaProduct(p.id);
  };

  return (
    <div className="beta-manage beta-product-manage">
      <h3>카테고리 · 품목 관리</h3>
      <p className="beta-manage-desc">카테고리당 품목을 추가·수정·삭제할 수 있습니다. 변경 시 지점 보고 폼에 바로 반영됩니다.</p>
      <div className="beta-manage-actions">
        <button type="button" className="btn btn-primary" onClick={() => { setAddingCategory(true); setName(''); }}>
          <Plus size={18} /> 카테고리 추가
        </button>
      </div>
      {addingCategory && (
        <div className="beta-manage-form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="카테고리명" />
          <button type="button" className="btn btn-primary" onClick={handleAddCategory}>저장</button>
          <button type="button" className="btn btn-secondary" onClick={() => setAddingCategory(false)}>취소</button>
        </div>
      )}
      <div className="beta-category-list">
        {categories.map((cat) => {
          const list = productsByCategory.get(cat.id) || [];
          const isExpanded = expandedCat === cat.id;
          return (
            <div key={cat.id} className="beta-category-block">
              <div className="beta-category-header" onClick={() => setExpandedCat(isExpanded ? null : cat.id)}>
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <span className="beta-category-name">
                  {editingCategory?.id === cat.id ? (
                    <input value={name} onChange={(e) => setName(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder={cat.name} />
                  ) : (
                    cat.name
                  )}
                </span>
                <span className="beta-category-count">({list.length}개)</span>
                <div className="beta-category-actions" onClick={(e) => e.stopPropagation()}>
                  {editingCategory?.id === cat.id ? (
                    <>
                      <button type="button" className="btn btn-primary btn-small" onClick={handleSaveCategory}>확인</button>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => { setEditingCategory(null); setName(''); }}>취소</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => { setEditingCategory(cat); setName(cat.name); }}><Pencil size={14} /></button>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => handleDeleteCategory(cat)}><Trash2 size={14} /></button>
                      <button type="button" className="btn btn-primary btn-small" onClick={() => { setAddingProduct(cat.id); setName(''); }}><Plus size={14} /> 품목</button>
                    </>
                  )}
                </div>
              </div>
              {isExpanded && (
                <div className="beta-product-list">
                  {addingProduct === cat.id && (
                    <div className="beta-manage-form beta-product-form">
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="품목명" />
                      <button type="button" className="btn btn-primary" onClick={() => handleAddProduct(cat.id)}>추가</button>
                      <button type="button" className="btn btn-secondary" onClick={() => { setAddingProduct(null); setName(''); }}>취소</button>
                    </div>
                  )}
                  {list.map((p) => (
                    <div key={p.id} className="beta-product-row">
                      {editingProduct?.id === p.id ? (
                        <>
                          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={p.name} />
                          <button type="button" className="btn btn-primary btn-small" onClick={handleSaveProduct}>확인</button>
                          <button type="button" className="btn btn-secondary btn-small" onClick={() => { setEditingProduct(null); setName(''); }}>취소</button>
                        </>
                      ) : (
                        <>
                          <span>{p.name}</span>
                          <button type="button" className="btn btn-secondary btn-small" onClick={() => { setEditingProduct(p); setName(p.name); }}><Pencil size={14} /></button>
                          <button type="button" className="btn btn-secondary btn-small" onClick={() => handleDeleteProduct(p)}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
