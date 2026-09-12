import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function ProductDetails({ products, addToCart, addToWishlist, wishlist = [], reviews = [], addReview, orders = [], customerSession }) {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: "5", text: "" });
  const [added, setAdded] = useState(false);

  const product = products.find((item) => String(item.id) === String(id));
  const isWishlisted = wishlist.some((item) => String(item.id) === String(product?.id));
  const images = [product?.image, ...(product?.images || [])].filter(Boolean).slice(0, 5);
  const productReviews = reviews.filter((review) => String(review.productId) === String(product?.id));
  const customerOrders = orders.filter((order) => {
    const orderEmail = order.customer?.email || order.customer_email;
    return customerSession && ((order.customerId && Number(order.customerId) === Number(customerSession.id)) || (orderEmail && orderEmail.toLowerCase() === customerSession.email?.toLowerCase()));
  });
  const hasPurchased = customerOrders.some((order) => order.status?.toLowerCase() === "delivered" && order.items?.some((item) => String(item.id || item.productId) === String(product?.id)));
  const hasReviewed = productReviews.some((review) => review.customerId === customerSession?.id || review.customerEmail === customerSession?.email);
  const canReview = Boolean(customerSession && hasPurchased && !hasReviewed);

  useEffect(() => {
    if (!product) return undefined;
    const previousTitle = document.title;
    const description = product.description || `${product.name} available at Super Mart Bhiwadi, Alwar.`;
    const schemaImages = [product.image, ...(product.images || [])].filter(Boolean).slice(0, 5);
    document.title = `${product.name} | Super Mart Bhiwadi`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[name="keywords"]')?.setAttribute("content", product.seoKeywords || `${product.name}, ${product.category}, best ${product.category} in Super Mart Bhiwadi, Super Mart Bhiwadi`);
    const structuredData = document.createElement("script");
    structuredData.type = "application/ld+json";
    structuredData.dataset.productSchema = "true";
    structuredData.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description,
      image: schemaImages,
      brand: { "@type": "Brand", name: "Super Mart" },
      category: product.category,
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: Number(product.price).toFixed(2),
        availability: Number(product.stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: window.location.href,
      },
    });
    document.head.appendChild(structuredData);
    return () => { document.title = previousTitle; structuredData.remove(); };
  }, [product]);

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1000);
  };

  const handleReview = (event) => {
    event.preventDefault();
    addReview({ productId: product.id, ...reviewForm, name: customerSession.name, customerId: customerSession.id, customerEmail: customerSession.email, rating: Number(reviewForm.rating), createdAt: new Date().toISOString() });
    setReviewForm({ name: "", rating: "5", text: "" });
  };

  if (!product) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Product Not Found
          </h1>

          <Link
            to="/products"
            className="mt-5 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="product-detail-page min-h-screen bg-gray-50 py-5 sm:py-12">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">

        <div className="product-detail-shell grid min-w-0 gap-6 rounded-2xl bg-white p-3 shadow-sm sm:gap-10 sm:rounded-3xl sm:p-6 md:grid-cols-2 md:p-10">

          <div className="min-w-0">
            <div className="product-detail-image overflow-hidden rounded-2xl bg-gray-100">
            <img
              src={images[selectedImage] || product.image}
              alt={product.name}
              className="h-full w-full object-contain"
            />
            </div>
            <div className="product-thumbnails mt-3 grid grid-cols-5 gap-1.5 sm:gap-2">
              {images.map((image, index) => <button key={image} type="button" onClick={() => setSelectedImage(index)} className={`product-thumbnail aspect-square overflow-hidden rounded-lg border-2 ${selectedImage === index ? "border-blue-600" : "border-transparent"}`}><img src={image} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-contain" /></button>)}
            </div>
          </div>

          <div className="min-w-0 flex flex-col justify-center">

            <p className="font-semibold text-blue-600">
              {product.category}
            </p>

            <h1 className="product-detail-title mt-3 break-words text-3xl font-bold text-gray-900 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4">
              <span className="text-yellow-500">
                ★★★★★
              </span>

              <span className="ml-2 text-gray-500">
                {product.rating} / 5
              </span>
            </div>

            <p className="mt-6 text-gray-600">
              {product.description}
            </p>

            <div className="mt-6">
              <span className="text-4xl font-bold">
                ₹{product.price.toLocaleString("en-IN")}
              </span>

              <span className="ml-3 text-lg text-gray-400 line-through">
                ₹{product.oldPrice.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="product-detail-actions mt-8 flex gap-3 sm:gap-4">
              <button
                onClick={handleAdd}
                className={`cart-action min-w-0 flex-1 rounded-xl px-3 py-3 text-sm font-bold text-white sm:px-6 sm:py-4 sm:text-base ${added ? "is-added" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {added ? "✓ Added to cart" : "🛒 Add to Cart"}
              </button>

              <button onClick={() => addToWishlist(product)} aria-label={isWishlisted ? "Remove product from wishlist" : "Add product to wishlist"} className={`shrink-0 rounded-xl border-2 px-4 py-3 text-xl transition sm:px-6 sm:py-4 ${isWishlisted ? "border-red-500 bg-red-50 text-red-600 shadow-md" : "border-red-300 text-red-400 hover:bg-red-50 hover:text-red-500"}`}>
                {isWishlisted ? "♥" : "♡"}
              </button>
            </div>

          </div>
        </div>
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="surface p-6 sm:p-8"><p className="eyebrow">Customer feedback</p><h2 className="mt-2 text-2xl font-black text-slate-950">Reviews &amp; ratings</h2>{productReviews.length ? <div className="mt-5 space-y-4">{productReviews.map((review) => <article key={review.id} className="border-b border-slate-100 pb-4"><div className="flex justify-between gap-3"><strong>{review.name}</strong><span className="text-amber-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{review.text}</p></article>)}</div> : <p className="mt-5 text-sm text-slate-500">Be the first to review this product.</p>}</div>
          {canReview ? <form onSubmit={handleReview} className="surface review-form p-6 sm:p-8"><h2 className="text-xl font-black text-slate-950">Write a review</h2><p className="mt-2 text-sm text-slate-500">Reviewing as {customerSession.name}</p><div className="mt-4 space-y-3"><select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })} className="field"><option value="5">★★★★★ Excellent</option><option value="4">★★★★ Very good</option><option value="3">★★★ Good</option><option value="2">★★ Needs improvement</option><option value="1">★ Poor</option></select><textarea required value={reviewForm.text} onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })} className="field min-h-28" placeholder="Share your experience" /></div><button className="button-primary mt-4 w-full">Publish review</button></form> : <div className="surface p-6 sm:p-8"><h2 className="text-xl font-black text-slate-950">Write a review</h2><p className="mt-3 text-sm leading-6 text-slate-600">{!customerSession ? "Please log in and purchase this product before reviewing it." : hasReviewed ? "You have already reviewed this product." : "Reviews are available after delivery. You can review this product once the order is marked Delivered."}</p>{!customerSession && <Link to="/login?mode=login" className="button-primary mt-4 w-full">Log in to review</Link>}</div>}
        </section>
      </div>
    </main>
  );
}

export default ProductDetails;
