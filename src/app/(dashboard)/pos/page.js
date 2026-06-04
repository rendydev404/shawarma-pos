'use client';

import { useState, useEffect, useCallback, useReducer } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Header from '@/components/Header';
import MenuGrid from '@/components/pos/MenuGrid';
import CartPanel from '@/components/pos/CartPanel';
import CheckoutModal from '@/components/pos/CheckoutModal';
import ReceiptPreview from '@/components/pos/ReceiptPreview';
import Toast, { useToast } from '@/components/ui/Toast';
import { formatRupiah } from '@/lib/utils';

// Cart reducer
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.product_id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.product_id === action.payload.id
              ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.product_price }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            product_id: action.payload.id,
            product_name: action.payload.name,
            product_price: action.payload.price,
            quantity: 1,
            subtotal: action.payload.price,
            notes: '',
          },
        ],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.product_id !== action.payload),
      };
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.product_id !== action.payload.product_id),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.product_id === action.payload.product_id
            ? {
              ...i,
              quantity: action.payload.quantity,
              subtotal: action.payload.quantity * i.product_price,
            }
            : i
        ),
      };
    }
    case 'UPDATE_NOTE':
      return {
        ...state,
        items: state.items.map((i) =>
          i.product_id === action.payload.product_id
            ? { ...i, notes: action.payload.notes }
            : i
        ),
      };
    case 'CLEAR':
      return { items: [], customerName: '', notes: '' };
    case 'SET_CUSTOMER_NAME':
      return { ...state, customerName: action.payload };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    default:
      return state;
  }
}

export default function POSPage() {
  const { profile, supabase } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { toasts, addToast, dismissToast } = useToast();

  const [cart, dispatch] = useReducer(cartReducer, {
    items: [],
    customerName: '',
    notes: '',
  });

  const outletId = profile?.outlet_id || profile?.outlets?.id;

  // Fetch categories & products
  const fetchData = useCallback(async () => {
    if (!outletId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const [catRes, prodRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('outlet_id', outletId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('products')
          .select('*, categories(name)')
          .eq('outlet_id', outletId)
          .eq('is_available', true)
          .order('sort_order', { ascending: true }),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) setProducts(prodRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      addToast('Gagal memuat data produk', 'error');
    } finally {
      setLoading(false);
    }
  }, [outletId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Calculate totals (Tax Inclusive)
  const total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
  const subtotal = Math.round(total / 1.11);
  const tax = total - subtotal;

  // Handle checkout
  const handleCheckout = async (paymentMethod, amountPaid) => {
    if (!outletId || cart.items.length === 0) return;

    try {
      // Generate order number
      const { data: orderNum, error: numError } = await supabase.rpc(
        'generate_order_number',
        { p_outlet_id: outletId }
      );

      if (numError) throw numError;

      const changeAmount = paymentMethod === 'cash' ? Math.max(0, amountPaid - total) : 0;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          outlet_id: outletId,
          cashier_id: profile?.id,
          order_number: orderNum,
          status: 'completed',
          payment_method: paymentMethod,
          subtotal,
          discount: 0,
          tax,
          total,
          amount_paid: paymentMethod === 'cash' ? amountPaid : total,
          change_amount: changeAmount,
          customer_name: cart.customerName || null,
          notes: cart.notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const items = cart.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.product_price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // Show receipt
      setReceiptData({
        ...order,
        items: cart.items,
        outletName: profile?.outlets?.name || 'Shawarma Outlet',
        outletCode: profile?.outlets?.code || '',
        cashierName: profile?.full_name || 'Kasir',
      });

      // Clear cart
      dispatch({ type: 'CLEAR' });
      setCheckoutOpen(false);
      addToast(`Order ${orderNum} berhasil! 🎉`, 'success');
    } catch (err) {
      console.error('Checkout error:', err);
      addToast('Gagal menyimpan order. Silakan coba lagi.', 'error');
    }
  };

  return (
    <>
      <Header
        title="Kasir"
        subtitle={profile?.outlets?.name}
      />

      <div className="pos-container">
        {/* Left: Menu Grid */}
        <div className="pos-menu-section">
          {/* Search Bar */}
          <div style={posStyles.searchBar}>
            <div className="input-with-icon" style={{ flex: 1 }}>
              <span className="material-icons-round">search</span>
              <input
                id="pos-search"
                type="text"
                className="input"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div style={posStyles.categoryTabs} className="category-tabs-container">
            <button
              className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setSelectedCategory('all')}
              id="pos-cat-all"
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="loading-screen" style={{ minHeight: '40vh' }}>
              <div className="spinner spinner-lg" />
              <p>Memuat produk...</p>
            </div>
          ) : !outletId ? (
            <div style={posStyles.emptyHero} className="animate-fade-in">
              <div style={posStyles.emptyIconWrap}>
                <span className="material-icons-round" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>store</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginTop: '16px' }}>
                Belum Ada Outlet Terpilih
              </h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', maxWidth: '360px', textAlign: 'center', lineHeight: 1.6 }}>
                Akun Super Admin tidak terhubung to outlet. Silakan buka <strong style={{ color: 'var(--color-primary)' }}>Kelola Outlet</strong> untuk menambahkan outlet, 
                lalu <strong style={{ color: 'var(--color-primary)' }}>Kelola User</strong> untuk assign outlet ke akun kasir.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={posStyles.emptyHero} className="animate-fade-in">
              <div style={posStyles.emptyIconWrap}>
                <span className="material-icons-round" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>restaurant_menu</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginTop: '16px' }}>
                {searchQuery ? `Produk "${searchQuery}" Tidak Ditemukan` : 'Menu Masih Kosong'}
              </h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', maxWidth: '320px', textAlign: 'center', lineHeight: 1.6 }}>
                {searchQuery
                  ? 'Coba kata kunci lain atau hapus filter kategori.'
                  : 'Tambahkan produk pertama Anda melalui halaman Menu di sidebar.'}
              </p>
            </div>
          ) : (
            <MenuGrid products={filteredProducts} onAddToCart={(product) => dispatch({ type: 'ADD_ITEM', payload: product })} />
          )}
        </div>

        {/* Backdrop overlay for mobile/tablet cart drawer */}
        {cartOpen && (
          <div 
            className="pos-cart-backdrop" 
            onClick={() => setCartOpen(false)}
          />
        )}

        {/* Right: Cart Panel */}
        <CartPanel
          cart={cart}
          subtotal={subtotal}
          tax={tax}
          total={total}
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          onUpdateQuantity={(product_id, quantity) =>
            dispatch({ type: 'UPDATE_QUANTITY', payload: { product_id, quantity } })
          }
          onRemoveItem={(product_id) =>
            dispatch({ type: 'REMOVE_ITEM', payload: product_id })
          }
          onUpdateNote={(product_id, notes) =>
            dispatch({ type: 'UPDATE_NOTE', payload: { product_id, notes } })
          }
          onSetCustomerName={(name) =>
            dispatch({ type: 'SET_CUSTOMER_NAME', payload: name })
          }
          onClear={() => dispatch({ type: 'CLEAR' })}
          onCheckout={() => {
            setCartOpen(false);
            setCheckoutOpen(true);
          }}
        />

        {/* Floating Cart action bar on mobile */}
        {cart.items.length > 0 && (
          <div 
            className="mobile-cart-toggle-bar" 
            onClick={() => setCartOpen(true)}
            id="pos-mobile-cart-trigger"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-icons-round" style={{ color: 'var(--color-primary)' }}>shopping_cart</span>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)} Item
                </span>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  Ketuk untuk detail
                </span>
              </div>
            </div>
            <button className="btn btn-primary btn-sm">
              Bayar {formatRupiah(total)}
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <CheckoutModal
          total={total}
          subtotal={subtotal}
          tax={tax}
          items={cart.items}
          onConfirm={handleCheckout}
          onClose={() => setCheckoutOpen(false)}
        />
      )}

      {/* Receipt Preview */}
      {receiptData && (
        <ReceiptPreview
          order={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

const posStyles = {
  container: {
    display: 'flex',
    height: 'calc(100vh - var(--header-height))',
    overflow: 'hidden',
  },
  menuSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: 'var(--space-md)',
    gap: 'var(--space-md)',
  },
  searchBar: {
    display: 'flex',
    gap: 'var(--space-sm)',
  },
  categoryTabs: {
    display: 'flex',
    gap: 'var(--space-sm)',
    overflowX: 'auto',
    paddingBottom: '4px',
    flexShrink: 0,
  },
  emptyHero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 'var(--space-2xl)',
    textAlign: 'center',
  },
  emptyIconWrap: {
    width: '120px',
    height: '120px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-primary-subtle)',
    border: '2px solid rgba(245, 158, 11, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 40px var(--color-primary-glow)',
  },
};
