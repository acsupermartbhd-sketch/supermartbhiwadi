import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProductOldPrice, getProductPrice, isPartnerUser } from "../data/pricing";

function ProductCard({ product, addToCart, addToWishlist, customerSession, hideCategory = false }) {
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();
  const price = getProductPrice(product, customerSession);
  const oldPrice = getProductOldPrice(product, customerSession);
  const isPartner = isPartnerUser(customerSession);

  const handleAdd = () => {
    addToCart({ ...product, price });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  };

  const openProduct = () => navigate(`/product/${product.id}`);
  const handleCardKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProduct();
    }
  };

  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800";

  return (
    <div className="product-card group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl" onClick={openProduct} onKeyDown={handleCardKeyDown} role="link" tabIndex={0} aria-label={`View details for ${product.name}`}>
      <div className="product-image-frame relative w-full overflow-hidden bg-gray-100">
        <img
          src={product.image || FALLBACK_IMAGE}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (e.currentTarget.src !== FALLBACK_IMAGE) {
              e.currentTarget.src = FALLBACK_IMAGE;
            }
          }}
          className="product-image h-full w-full object-contain transition duration-500 group-hover:scale-105"
        />
        <button onClick={(event) => { event.stopPropagation(); addToWishlist(product); }} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-md hover:bg-red-50 hover:text-red-500">♡</button>
        {isPartner && <span className="partner-price-badge absolute left-3 top-3">★ Partner</span>}
      </div>
      <div className="relative z-10 flex flex-1 flex-col p-5">
        { !hideCategory && (
          <p className="mb-1 text-sm font-medium text-blue-600">{product.category}</p>
        ) }
        <Link to={`/product/${product.id}`} onClick={(event) => event.stopPropagation()}><h3 className="line-clamp-1 text-lg font-bold text-gray-900 hover:text-blue-600">{product.name}</h3></Link>
        <div className="mt-2 flex items-center gap-2"><span className="text-yellow-500">★</span><span className="text-sm text-gray-600">{product.rating}</span></div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className={`text-xl font-bold ${isPartner ? "text-amber-600" : "text-gray-900"}`}>₹{price.toLocaleString("en-IN")}</span>
          {isPartner ? (
            <span className="text-sm text-gray-400 line-through">₹{oldPrice.toLocaleString("en-IN")}</span>
          ) : (
            <span className="text-sm text-gray-400 line-through">₹{oldPrice.toLocaleString("en-IN")}</span>
          )}
        </div>
        <Link to={`/product/${product.id}`} onClick={(event) => event.stopPropagation()} className="mt-3 text-sm font-black text-blue-600 hover:text-blue-800">View complete details →</Link>
        <button
          disabled={Number(product.stock) <= 0}
          onClick={(event) => { event.stopPropagation(); handleAdd(); }}
          className={`cart-action mt-auto w-full rounded-xl px-4 py-3 font-semibold text-white transition ${
            Number(product.stock) <= 0
              ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
              : added
              ? "is-added"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <span className={added ? "cart-check" : ""}>
            {Number(product.stock) <= 0 ? "Out of Stock" : added ? "✓ Added to cart" : "🛒 Add to Cart"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
