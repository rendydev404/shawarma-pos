'use client';

import { formatRupiah } from '@/lib/utils';

export default function MenuGrid({ products, onAddToCart }) {
  return (
    <div style={gridStyles.container}>
      {products.map((product, index) => (
        <button
          key={product.id}
          style={gridStyles.card}
          onClick={() => onAddToCart(product)}
          id={`pos-product-${product.id}`}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3), 0 0 16px rgba(245, 158, 11, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.97)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
        >
          {/* Product Image / Placeholder */}
          <div style={gridStyles.imageContainer}>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                style={gridStyles.image}
              />
            ) : (
              <div style={gridStyles.imagePlaceholder}>
                <span className="material-icons-round" style={{ fontSize: '36px', color: 'var(--text-tertiary)' }}>
                  restaurant
                </span>
              </div>
            )}
            {!product.is_available && (
              <div style={gridStyles.soldOutBadge}>Habis</div>
            )}
          </div>

          {/* Product Info */}
          <div style={gridStyles.info}>
            <span style={gridStyles.category}>
              {product.categories?.name || 'Lainnya'}
            </span>
            <h3 style={gridStyles.name}>{product.name}</h3>
            <span style={gridStyles.price}>{formatRupiah(product.price)}</span>
          </div>

          {/* Add indicator */}
          <div style={gridStyles.addIcon}>
            <span className="material-icons-round" style={{ fontSize: '20px' }}>add</span>
          </div>
        </button>
      ))}
    </div>
  );
}

const gridStyles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 'var(--space-md)',
    overflowY: 'auto',
    padding: '4px',
    flex: 1,
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    textAlign: 'left',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-sm)',
    color: 'var(--text-primary)',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 'inherit',
  },
  imageContainer: {
    width: '100%',
    height: '110px',
    position: 'relative',
    overflow: 'hidden',
    background: 'var(--bg-tertiary)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))',
  },
  soldOutBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '2px 8px',
    background: 'rgba(239, 68, 68, 0.9)',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    borderRadius: 'var(--radius-full)',
    textTransform: 'uppercase',
  },
  info: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  category: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--color-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  name: {
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    lineHeight: 1.3,
    fontFamily: 'var(--font-body)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  price: {
    fontSize: 'var(--text-sm)',
    fontWeight: '700',
    color: 'var(--color-primary-light)',
    marginTop: '2px',
  },
  addIcon: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    width: '28px',
    height: '28px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-primary)',
    color: 'var(--text-inverse)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
    transition: 'all var(--transition-fast)',
  },
};
