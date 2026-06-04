'use client';

import { formatRupiah } from '@/lib/utils';

export default function CartPanel({
  cart,
  subtotal,
  tax,
  total,
  open,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNote,
  onSetCustomerName,
  onClear,
  onCheckout,
}) {
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={`pos-cart-panel ${open ? 'open' : ''}`}>
      {/* Cart Header */}
      <div style={cartStyles.header}>
        <div style={cartStyles.headerTitle}>
          <button
            className="btn btn-ghost btn-icon cart-close-btn"
            onClick={onClose}
            style={{ marginRight: '8px' }}
            id="pos-cart-close"
          >
            <span className="material-icons-round">arrow_back</span>
          </button>
          <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: '22px' }}>
            shopping_cart
          </span>
          <h2 style={cartStyles.title}>Pesanan</h2>
          {itemCount > 0 && (
            <span className="badge badge-primary" style={{ marginLeft: '4px' }}>
              {itemCount}
            </span>
          )}
        </div>
        {cart.items.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClear}
            style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}
            id="pos-cart-clear"
          >
            <span className="material-icons-round" style={{ fontSize: '16px' }}>delete_sweep</span>
            Hapus
          </button>
        )}
      </div>

      {/* Customer Name (Optional) */}
      <div style={cartStyles.customerInput}>
        <input
          type="text"
          className="input"
          placeholder="Nama pelanggan (opsional)"
          value={cart.customerName}
          onChange={(e) => onSetCustomerName(e.target.value)}
          style={{ padding: '8px 12px', fontSize: 'var(--text-sm)' }}
          id="pos-customer-name"
        />
      </div>

      {/* Cart Items */}
      <div style={cartStyles.items}>
        {cart.items.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
            <span className="material-icons-round" style={{ fontSize: '48px' }}>receipt_long</span>
            <p>Belum ada item. Ketuk produk untuk menambahkan.</p>
          </div>
        ) : (
          cart.items.map((item) => (
            <div key={item.product_id} style={cartStyles.item} className="animate-slide-up">
              <div style={cartStyles.itemInfo}>
                <span style={cartStyles.itemName}>{item.product_name}</span>
                <span style={cartStyles.itemPrice}>{formatRupiah(item.product_price)}</span>
              </div>

              <div style={cartStyles.itemActions}>
                <div style={cartStyles.qtyControls}>
                  <button
                    style={cartStyles.qtyBtn}
                    onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                    id={`pos-qty-minus-${item.product_id}`}
                  >
                    <span className="material-icons-round" style={{ fontSize: '16px' }}>remove</span>
                  </button>
                  <span style={cartStyles.qtyValue}>{item.quantity}</span>
                  <button
                    style={cartStyles.qtyBtn}
                    onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                    id={`pos-qty-plus-${item.product_id}`}
                  >
                    <span className="material-icons-round" style={{ fontSize: '16px' }}>add</span>
                  </button>
                </div>
                <span style={cartStyles.itemSubtotal}>{formatRupiah(item.subtotal)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary */}
      {cart.items.length > 0 && (
        <div style={cartStyles.summary}>
          <div style={cartStyles.summaryRow}>
            <span style={cartStyles.summaryLabel}>Subtotal</span>
            <span style={cartStyles.summaryValue}>{formatRupiah(subtotal)}</span>
          </div>
          <div style={cartStyles.summaryRow}>
            <span style={cartStyles.summaryLabel}>PPN (11%)</span>
            <span style={cartStyles.summaryValue}>{formatRupiah(tax)}</span>
          </div>
          <div style={cartStyles.divider} />
          <div style={cartStyles.summaryRow}>
            <span style={cartStyles.totalLabel}>TOTAL</span>
            <span style={cartStyles.totalValue}>{formatRupiah(total)}</span>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={cartStyles.checkoutBtn}
            onClick={onCheckout}
            id="pos-checkout"
          >
            <span className="material-icons-round">payments</span>
            Bayar {formatRupiah(total)}
          </button>
        </div>
      )}
    </div>
  );
}

const cartStyles = {
  container: {
    width: '360px',
    minWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-md)',
    borderBottom: '1px solid var(--border-color)',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: 'var(--text-lg)',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
  },
  customerInput: {
    padding: 'var(--space-sm) var(--space-md)',
    borderBottom: '1px solid var(--border-color)',
  },
  items: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--space-sm) var(--space-md)',
  },
  item: {
    padding: '12px 0',
    borderBottom: '1px solid var(--border-color)',
  },
  itemInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  itemName: {
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    flex: 1,
    paddingRight: '8px',
  },
  itemPrice: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
    whiteSpace: 'nowrap',
  },
  itemActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    padding: '2px',
  },
  qtyBtn: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    transition: 'background var(--transition-fast)',
  },
  qtyValue: {
    fontSize: 'var(--text-sm)',
    fontWeight: '700',
    minWidth: '24px',
    textAlign: 'center',
    color: 'var(--text-primary)',
  },
  itemSubtotal: {
    fontSize: 'var(--text-sm)',
    fontWeight: '700',
    color: 'var(--color-primary-light)',
  },
  summary: {
    padding: 'var(--space-md)',
    borderTop: '1px solid var(--border-color)',
    background: 'var(--bg-tertiary)',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  summaryLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
  },
  summaryValue: {
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  divider: {
    height: '1px',
    background: 'var(--border-color)',
    margin: '8px 0',
  },
  totalLabel: {
    fontSize: 'var(--text-base)',
    fontWeight: '800',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
  },
  totalValue: {
    fontSize: 'var(--text-xl)',
    fontWeight: '800',
    color: 'var(--color-primary-light)',
    fontFamily: 'var(--font-heading)',
  },
  checkoutBtn: {
    width: '100%',
    marginTop: 'var(--space-md)',
    fontSize: 'var(--text-base)',
    padding: '14px',
  },
};
