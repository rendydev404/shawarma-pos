'use client';

import { formatRupiah, formatDate, formatTime } from '@/lib/utils';

export default function ReceiptPreview({ order, onClose }) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk - ${order.order_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 8px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .item-name { max-width: 60%; }
          h1 { font-size: 16px; margin: 4px 0; }
          h2 { font-size: 14px; margin: 2px 0; }
          .total-row { font-size: 14px; font-weight: bold; }
          @media print { body { width: 80mm; } }
        </style>
      </head>
      <body>
        <div class="center">
          <h1>🧆 SHAWARMA</h1>
          <h2>${order.outletName || 'Outlet'}</h2>
          <p style="font-size: 10px; margin-top: 4px;">Terima kasih atas kunjungan Anda</p>
        </div>
        <div class="divider"></div>
        <div class="row">
          <span>No: ${order.order_number}</span>
        </div>
        <div class="row">
          <span>${formatDate(order.created_at)}</span>
        </div>
        <div class="row">
          <span>Kasir: ${order.cashierName || '-'}</span>
        </div>
        ${order.customer_name ? `<div class="row"><span>Pelanggan: ${order.customer_name}</span></div>` : ''}
        <div class="divider"></div>
        ${order.items.map(item => `
          <div style="margin: 4px 0;">
            <div class="item-name bold">${item.product_name}</div>
            <div class="row">
              <span>${item.quantity} x ${formatRupiah(item.product_price)}</span>
              <span>${formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        `).join('')}
        <div class="divider"></div>
        <div class="row">
          <span>Subtotal</span>
          <span>${formatRupiah(order.subtotal)}</span>
        </div>
        <div class="divider"></div>
        <div class="row total-row">
          <span>TOTAL</span>
          <span>${formatRupiah(order.total)}</span>
        </div>
        <div class="divider"></div>
        <div class="row">
          <span>Bayar (${order.payment_method?.toUpperCase()})</span>
          <span>${formatRupiah(order.amount_paid)}</span>
        </div>
        ${order.payment_method === 'cash' ? `
          <div class="row">
            <span>Kembalian</span>
            <span>${formatRupiah(order.change_amount)}</span>
          </div>
        ` : ''}
        <div class="divider"></div>
        <div class="center" style="margin-top: 8px;">
          <p style="font-size: 10px;">--- Terima Kasih ---</p>
          <p style="font-size: 10px;">Selamat Menikmati! 🧆</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>
            <span className="material-icons-round" style={{ marginRight: '8px', color: 'var(--color-success)', verticalAlign: 'middle' }}>check_circle</span>
            Order Berhasil!
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="receipt-close">
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="modal-body">
          {/* Receipt Preview */}
          <div style={receiptStyles.receipt}>
            <div style={receiptStyles.header}>
              <span style={{ fontSize: '32px' }}>🧆</span>
              <h3 style={receiptStyles.brandName}>SHAWARMA</h3>
              <p style={receiptStyles.outletName}>{order.outletName}</p>
            </div>

            <div style={receiptStyles.divider} />

            <div style={receiptStyles.info}>
              <div style={receiptStyles.infoRow}>
                <span>No. Order</span>
                <span style={{ fontWeight: '700' }}>{order.order_number}</span>
              </div>
              <div style={receiptStyles.infoRow}>
                <span>Tanggal</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div style={receiptStyles.infoRow}>
                <span>Kasir</span>
                <span>{order.cashierName}</span>
              </div>
              {order.customer_name && (
                <div style={receiptStyles.infoRow}>
                  <span>Pelanggan</span>
                  <span>{order.customer_name}</span>
                </div>
              )}
            </div>

            <div style={receiptStyles.divider} />

            <div style={receiptStyles.items}>
              {order.items.map((item, idx) => (
                <div key={idx} style={receiptStyles.item}>
                  <div style={receiptStyles.itemName}>{item.product_name}</div>
                  <div style={receiptStyles.itemDetail}>
                    <span>{item.quantity} × {formatRupiah(item.product_price)}</span>
                    <span style={{ fontWeight: '600' }}>{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={receiptStyles.divider} />

            <div style={receiptStyles.totals}>
              <div style={receiptStyles.totalRow}>
                <span>Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              <div style={{ ...receiptStyles.totalRow, ...receiptStyles.grandTotal }}>
                <span>TOTAL</span>
                <span>{formatRupiah(order.total)}</span>
              </div>
            </div>

            <div style={receiptStyles.divider} />

            <div style={receiptStyles.payment}>
              <div style={receiptStyles.totalRow}>
                <span>Bayar ({order.payment_method?.toUpperCase()})</span>
                <span>{formatRupiah(order.amount_paid)}</span>
              </div>
              {order.payment_method === 'cash' && (
                <div style={{ ...receiptStyles.totalRow, color: 'var(--color-success)' }}>
                  <span>Kembalian</span>
                  <span style={{ fontWeight: '700' }}>{formatRupiah(order.change_amount)}</span>
                </div>
              )}
            </div>

            <div style={receiptStyles.footer}>
              <p>Terima Kasih! 🧆</p>
              <p>Selamat Menikmati</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            <span className="material-icons-round">close</span>
            Tutup
          </button>
          <button className="btn btn-primary" onClick={handlePrint} id="receipt-print">
            <span className="material-icons-round">print</span>
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
}

const receiptStyles = {
  receipt: {
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-lg)',
    fontFamily: "'Courier New', monospace",
    fontSize: 'var(--text-xs)',
  },
  header: {
    textAlign: 'center',
    paddingBottom: '8px',
  },
  brandName: {
    fontSize: 'var(--text-lg)',
    fontWeight: '800',
    letterSpacing: '0.1em',
    color: 'var(--color-primary-light)',
  },
  outletName: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  divider: {
    borderTop: '1px dashed var(--border-color)',
    margin: '10px 0',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--text-secondary)',
    fontSize: '11px',
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemName: {
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  itemDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--text-secondary)',
    paddingLeft: '8px',
  },
  totals: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--text-secondary)',
  },
  grandTotal: {
    fontWeight: '800',
    fontSize: 'var(--text-base)',
    color: 'var(--color-primary-light)',
    marginTop: '4px',
  },
  payment: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '12px',
    color: 'var(--text-tertiary)',
    fontSize: '11px',
  },
};
