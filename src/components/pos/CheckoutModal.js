'use client';

import { useState } from 'react';
import { formatRupiah } from '@/lib/utils';

export default function CheckoutModal({ total, subtotal, tax, items, onConfirm, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);

  const amountNum = parseInt(amountPaid.replace(/[^0-9]/g, ''), 10) || 0;
  const change = paymentMethod === 'cash' ? Math.max(0, amountNum - total) : 0;
  const canPay = paymentMethod === 'qris' || amountNum >= total;

  const quickAmounts = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    100000,
    150000,
    200000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 4);

  const handleConfirm = async () => {
    if (!canPay) return;
    setLoading(true);
    try {
      await onConfirm(paymentMethod, paymentMethod === 'cash' ? amountNum : total);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <span className="material-icons-round" style={{ marginRight: '8px', color: 'var(--color-primary)', verticalAlign: 'middle' }}>payments</span>
            Pembayaran
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="checkout-close">
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Order Summary */}
          <div style={checkoutStyles.orderSummary}>
            <div style={checkoutStyles.summaryItems}>
              {items.map((item) => (
                <div key={item.product_id} style={checkoutStyles.summaryItem}>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>
                    {item.product_name} × {item.quantity}
                  </span>
                  <span style={{ fontWeight: '600', fontSize: 'var(--text-sm)' }}>
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div style={checkoutStyles.summaryDivider} />
            <div style={checkoutStyles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            <div style={checkoutStyles.summaryRow}>
              <span>PPN 11%</span>
              <span>{formatRupiah(tax)}</span>
            </div>
            <div style={checkoutStyles.summaryDivider} />
            <div style={checkoutStyles.totalRow}>
              <span>TOTAL</span>
              <span>{formatRupiah(total)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label style={checkoutStyles.label}>Metode Pembayaran</label>
            <div style={checkoutStyles.paymentOptions}>
              <button
                style={{
                  ...checkoutStyles.paymentBtn,
                  ...(paymentMethod === 'cash' ? checkoutStyles.paymentBtnActive : {}),
                }}
                onClick={() => setPaymentMethod('cash')}
                id="checkout-method-cash"
              >
                <span className="material-icons-round" style={{ fontSize: '28px' }}>payments</span>
                <span style={checkoutStyles.paymentLabel}>Cash</span>
              </button>
              <button
                style={{
                  ...checkoutStyles.paymentBtn,
                  ...(paymentMethod === 'qris' ? checkoutStyles.paymentBtnActive : {}),
                }}
                onClick={() => setPaymentMethod('qris')}
                id="checkout-method-qris"
              >
                <span className="material-icons-round" style={{ fontSize: '28px' }}>qr_code_2</span>
                <span style={checkoutStyles.paymentLabel}>QRIS</span>
              </button>
            </div>
          </div>

          {/* Cash Amount Input */}
          {paymentMethod === 'cash' && (
            <div className="animate-slide-down">
              <label style={checkoutStyles.label}>Jumlah Bayar</label>
              <input
                type="text"
                className="input"
                placeholder="Masukkan nominal"
                value={amountPaid ? formatRupiah(amountNum) : ''}
                onChange={(e) => setAmountPaid(e.target.value.replace(/[^0-9]/g, ''))}
                style={{ fontSize: 'var(--text-xl)', fontWeight: '700', textAlign: 'center', padding: '16px' }}
                autoFocus
                id="checkout-amount"
              />

              {/* Quick Amount Buttons */}
              <div style={checkoutStyles.quickAmounts}>
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    className="btn btn-secondary btn-sm"
                    onClick={() => setAmountPaid(amount.toString())}
                  >
                    {formatRupiah(amount)}
                  </button>
                ))}
              </div>

              {/* Change Display */}
              {amountNum > 0 && (
                <div style={{
                  ...checkoutStyles.changeBox,
                  borderColor: canPay ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                  background: canPay ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: canPay ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {canPay ? 'Kembalian' : 'Kurang'}
                  </span>
                  <span style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: '800',
                    fontFamily: 'var(--font-heading)',
                    color: canPay ? 'var(--color-success)' : 'var(--color-danger)',
                  }}>
                    {canPay ? formatRupiah(change) : formatRupiah(total - amountNum)}
                  </span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'qris' && (
            <div style={checkoutStyles.qrisInfo} className="animate-slide-down">
              <span className="material-icons-round" style={{ fontSize: '48px', color: 'var(--color-primary)' }}>qr_code_2</span>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Scan QRIS untuk pembayaran sebesar
              </p>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: '800', color: 'var(--color-primary-light)' }}>
                {formatRupiah(total)}
              </span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleConfirm}
            disabled={!canPay || loading}
            id="checkout-confirm"
            style={{ minWidth: '180px' }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                Memproses...
              </>
            ) : (
              <>
                <span className="material-icons-round">check_circle</span>
                Konfirmasi Bayar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const checkoutStyles = {
  orderSummary: {
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
  },
  summaryItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '150px',
    overflowY: 'auto',
    marginBottom: '12px',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'var(--text-secondary)',
  },
  summaryDivider: {
    height: '1px',
    background: 'var(--border-color)',
    margin: '8px 0',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--text-lg)',
    fontWeight: '800',
    color: 'var(--color-primary-light)',
    fontFamily: 'var(--font-heading)',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  },
  paymentOptions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-sm)',
  },
  paymentBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px',
    background: 'var(--bg-tertiary)',
    border: '2px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    transition: 'all var(--transition-fast)',
    fontFamily: 'inherit',
  },
  paymentBtnActive: {
    borderColor: 'var(--color-primary)',
    background: 'var(--color-primary-subtle)',
    color: 'var(--color-primary)',
    boxShadow: '0 0 16px var(--color-primary-glow)',
  },
  paymentLabel: {
    fontSize: 'var(--text-sm)',
    fontWeight: '700',
  },
  quickAmounts: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '12px',
  },
  changeBox: {
    marginTop: '16px',
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  qrisInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: 'var(--space-xl)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
  },
};
