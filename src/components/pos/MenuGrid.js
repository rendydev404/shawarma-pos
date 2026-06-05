'use client';

import { formatRupiah } from '@/lib/utils';

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1626700051175-6518c4793f4f?auto=format&fit=crop&w=400&q=80';

export default function MenuGrid({ products, onAddToCart }) {
  return (
    <div className="pos-menu-grid">
      {products.map((product) => {
        const imageUrl = (product.image_url && 
                          product.image_url !== 'null' && 
                          product.image_url !== 'undefined' && 
                          product.image_url.trim() !== '') 
                          ? product.image_url 
                          : DEFAULT_PRODUCT_IMAGE;

        return (
          <div
            key={product.id}
            className="pos-menu-card animate-slide-up"
            onClick={() => onAddToCart(product)}
            id={`pos-product-${product.id}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onAddToCart(product);
              }
            }}
          >
            {/* Product Image / Placeholder */}
            <div className="pos-menu-card-image-wrap">
              <img
                src={imageUrl}
                alt={product.name}
                className="pos-menu-card-image"
              />
              {!product.is_available && (
                <div className="pos-menu-card-soldout">Habis</div>
              )}
            </div>

            {/* Product Info */}
            <div className="pos-menu-card-info">
              <h3 className="pos-menu-card-name">{product.name}</h3>
              <span className="pos-menu-card-price">{formatRupiah(product.price)}</span>
            </div>

            {/* Add indicator */}
            <div className="pos-menu-card-add">
              <span className="material-icons-round">add</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


