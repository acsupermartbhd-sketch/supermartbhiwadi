import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";

function Home({ products = [], addToCart, addToWishlist, reviews = [], customerSession }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [reviewDirection, setReviewDirection] = useState("down");

  const slides = products.slice(0, 3).map((product, index) => ({
    product,
    label: index === 0 ? "Editor's pick" : index === 1 ? "Work smarter" : "New favourite",
    headline: index === 0 ? "Power up your everyday" : index === 1 ? "Tech that keeps up" : "Big upgrades, better value",
  }));
  const storefrontImages = ["/image/main.webp", "/image/main2.webp", "/image/main3.webp", "/image/main4.webp", "/image/main5.webp", "/image/main6.webp"];
  const heroSlides = [...storefrontImages.map((image, index) => ({ id: `storefront-${index}`, isStorefront: true, image, headline: index === 0 ? "Your trusted Super Mart in Bhiwadi" : "Explore Super Mart in person" })), ...slides.map((slide) => ({ ...slide, id: slide.product.id, image: slide.product.image }))];
  const visibleSlide = activeSlide < heroSlides.length ? activeSlide : 0;
  const shopReviews = reviews.filter((review) => review.type === "shop");
  const topReviews = shopReviews.filter((_review, index) => index % 2 === 0);
  const bottomReviews = shopReviews.filter((_review, index) => index % 2 === 1);
  const topReviewLoop = topReviews.length > 1 ? [...topReviews, ...topReviews] : topReviews;
  const bottomReviewLoop = bottomReviews.length > 1 ? [...bottomReviews, ...bottomReviews] : bottomReviews;

  useEffect(() => {
    if (heroSlides.length < 2) return undefined;
    const timer = window.setInterval(() => setActiveSlide((slide) => (slide + 1) % heroSlides.length), 5000);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    let previousScrollY = window.scrollY;
    let frame = 0;
    const updateReviewDirection = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - previousScrollY) > 2) setReviewDirection(currentScrollY > previousScrollY ? "down" : "up");
      previousScrollY = currentScrollY;
      frame = 0;
    };
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateReviewDirection);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => { window.removeEventListener("scroll", handleScroll); if (frame) window.cancelAnimationFrame(frame); };
  }, []);

  const categories = [
    {
      name: "Laptops",
      desc: "HP, Dell, Asus, Acer",
      icon: "💻",
      link: "/products/Laptop",
      color: "from-blue-500/10 to-indigo-500/10 border-blue-200/60 hover:border-blue-500",
      accent: "text-blue-600 bg-blue-50",
    },
    {
      name: "Printers",
      desc: "Ink Tank, Laser & Barcode",
      icon: "🖨️",
      link: "/products/Printer",
      color: "from-purple-500/10 to-pink-500/10 border-purple-200/60 hover:border-purple-500",
      accent: "text-purple-600 bg-purple-50",
    },
    {
      name: "Desktop & PC",
      desc: "CPUs, RAM & Parts",
      icon: "🖥️",
      link: "/products/Desktop",
      color: "from-cyan-500/10 to-blue-500/10 border-cyan-200/60 hover:border-cyan-500",
      accent: "text-cyan-700 bg-cyan-50",
    },
    {
      name: "CCTV & Security",
      desc: "Wi-Fi Cameras & NVR",
      icon: "📹",
      link: "/products/Security",
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-200/60 hover:border-emerald-500",
      accent: "text-emerald-700 bg-emerald-50",
    },
    {
      name: "Cables & Connectors",
      desc: "HDMI, LAN, Audio, OTG",
      icon: "🔌",
      link: "/products/Cables",
      color: "from-amber-500/10 to-orange-500/10 border-amber-200/60 hover:border-amber-500",
      accent: "text-amber-700 bg-amber-50",
    },
    {
      name: "Accessories",
      desc: "Keyboard, Mouse & Audio",
      icon: "🎧",
      link: "/products/Accessories",
      color: "from-rose-500/10 to-pink-500/10 border-rose-200/60 hover:border-rose-500",
      accent: "text-rose-600 bg-rose-50",
    },
  ];

  // Group products by category – show up to 8 per category
  const categoryGroups = useMemo(() => {
    const groups = [
      { key: "Laptop", label: "Laptops", link: "/products/Laptop", icon: "💻" },
      { key: "Desktop", label: "Desktops & PCs", link: "/products/Desktop", icon: "🖥️" },
      { key: "Printer", label: "Printers", link: "/products/Printers", icon: "🖨️" },
      { key: "Security", label: "CCTV & Security", link: "/products/Security", icon: "📹" },
      { key: "Cable", label: "Cables & Connectors", link: "/products/Cable", icon: "🔌" },
      { key: "Networking", label: "Networking", link: "/products/Networking", icon: "🌐" },
      { key: "Storage", label: "Storage Devices", link: "/products/Storage", icon: "💾" },
      { key: "Display", label: "Monitors & Displays", link: "/products/Display", icon: "🖥️" },
      { key: "Accessories", label: "Accessories", link: "/products/Accessories", icon: "🎧" },
      { key: "Software", label: "Software", link: "/products/Software", icon: "💿" },
      { key: "Telecom", label: "Telecom", link: "/products/Telecom", icon: "☎️" },
    ];

    return groups.map((group) => {
      const matched = products.filter((p) => {
        const cat = String(p.category || "").toLowerCase();
        const name = String(p.name || "").toLowerCase();
        const key = group.key.toLowerCase();
        // cable collision prevention: cables must not appear in other categories
        const isCable = cat.includes("cable") || name.includes("cable") || name.includes("hdmi") || name.includes("patch cord");
        if (group.key !== "Cable" && group.key !== "Networking" && isCable) return false;
        if (group.key === "Cable") return isCable;
        return cat.includes(key) || cat === key;
      }).slice(0, 8);
      return { ...group, products: matched };
    }).filter((g) => g.products.length > 0);
  }, [products]);

  return (
    <main>
      {/* Hero slider */}
      <section className="home-hero">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-5 sm:px-6 sm:py-8 lg:py-10">
          <div className="relative z-10 flex min-h-90 flex-col items-start justify-center rounded-3xl p-6 text-white sm:min-h-120 sm:p-10 lg:min-h-135 lg:p-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[.18em] text-blue-200">Welcome to SuperMart · Bhiwadi</p>
            <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-[-.04em] sm:text-5xl lg:text-6xl">{heroSlides[visibleSlide]?.isStorefront ? "Your trusted Super Mart in Bhiwadi" : heroSlides[visibleSlide]?.headline || "Upgrade your digital life"}</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-blue-100 sm:text-lg">Reliable laptops, printers, CCTV cameras and accessories with honest prices and quick local delivery.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/products" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50">Shop all products →</Link>
              {heroSlides[visibleSlide] && !heroSlides[visibleSlide].isStorefront && <Link to={`/product/${heroSlides[visibleSlide].product.id}`} className="rounded-xl border border-blue-300/70 px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-blue-700">View this pick</Link>}
            </div>
            <div className="mt-8 flex items-center gap-2" aria-label="Hero slides">
              {heroSlides.map((slide, index) => <button key={`${slide.id}-${index}`} type="button" onClick={() => setActiveSlide(index)} aria-label={`Show slide ${index + 1}`} className={`h-2 rounded-full transition-all ${visibleSlide === index ? "w-9 bg-white" : "w-2 bg-blue-300"}`} />)}
            </div>
          </div>
          {heroSlides[visibleSlide] && <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/20 bg-slate-950/30 shadow-2xl">
            <img src={heroSlides[visibleSlide].image} alt={heroSlides[visibleSlide].isStorefront ? "Super Mart storefront in Bhiwadi" : heroSlides[visibleSlide].product.name} loading="eager" fetchPriority="high" decoding="async" className="h-full w-full object-cover brightness-75 transition duration-700" />
          </div>}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-slate-50/80 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="eyebrow text-xs font-black uppercase tracking-wider text-blue-600">Explore Catalog</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              Shop By Category
            </h2>
            <p className="mt-2 text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
              Find genuine laptops, high-speed printers, CCTV cameras, cables, and premium computer parts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.link}
                className={`group relative flex flex-col items-center justify-center rounded-2xl border bg-gradient-to-b ${category.color} p-4 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-5`}
              >
                <div className="text-4xl sm:text-5xl transition-transform duration-300 group-hover:scale-110">
                  {category.icon}
                </div>
                <h3 className="mt-3 font-bold text-gray-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
                <p className="mt-1 text-[11px] text-gray-500 line-clamp-1">
                  {category.desc}
                </p>
                <span className="mt-3 inline-flex items-center text-[11px] font-black text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  Browse →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products by Category Showcase */}
      {categoryGroups.map((group) => (
        <section key={group.key} className="py-10 sm:py-12 border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{group.icon}</span>
                <div>
                  <h2 className="text-xl font-black text-slate-900 sm:text-2xl">{group.label}</h2>
                  <p className="text-xs text-slate-500">{group.products.length} product{group.products.length !== 1 ? "s" : ""} available</p>
                </div>
              </div>
              <Link
                to={group.link}
                className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {group.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                  addToWishlist={addToWishlist}
                  customerSession={customerSession}
                  hideCategory={true}
                />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Fallback if no products from server yet */}
      {categoryGroups.length === 0 && (
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <p className="text-3xl">🔍</p>
              <p className="mt-2 text-sm font-bold text-slate-700">Loading products...</p>
            </div>
          </div>
        </section>
      )}

      {/* Reviews Marquee */}
      <section className="shop-review-section bg-blue-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="eyebrow">Super Mart community</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">What customers say</h2>
            <p className="mt-3 text-slate-600">Real experiences from the Super Mart community.</p>
            <p className="mt-2 text-sm font-semibold text-blue-700">Your feedback helps us serve Bhiwadi better.</p>
            <p className="mt-1 text-sm text-slate-500">Every review helps another shopper buy with confidence.</p>
            <div className="mt-6 flex items-center gap-3">
              <span className="text-2xl text-amber-500">★★★★★</span>
              <span className="text-sm font-black text-slate-600">Loved by local shoppers</span>
            </div>
          </div>
          <div className="review-stack">
            {shopReviews.length ? (
              <>
                <div className="review-rail">
                  <div className={`review-marquee-track review-marquee-${reviewDirection}`}>
                    {topReviewLoop.map((review, index) => (
                      <ReviewCard key={`${review.id}-top-${index}`} review={review} />
                    ))}
                  </div>
                </div>
                {bottomReviews.length > 0 && (
                  <div className="review-rail">
                    <div className={`review-marquee-track review-marquee-${reviewDirection === "down" ? "up" : "down"} review-marquee-slower`}>
                      {bottomReviewLoop.map((review, index) => (
                        <ReviewCard key={`${review.id}-bottom-${index}`} review={review} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 p-8 text-center text-sm text-slate-500">
                No reviews yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pro-Level Features & Trust Badges */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#0a1528] to-slate-950 py-16 sm:py-20 text-white">
        {/* Glow ambient background elements */}
        <div className="pointer-events-none absolute -top-24 left-1/4 size-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 size-96 rounded-full bg-indigo-600/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-400">
              Why Choose Super Mart
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-white">
              The Gold Standard in Local Electronics
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Trusted by 10,000+ happy customers and 500+ businesses across Bhiwadi & NCR.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Fast Delivery */}
            <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-blue-500/15">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                ⚡
              </div>
              <h3 className="mt-5 text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                Fast Local Delivery
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Express same-day dispatch in Bhiwadi and neighbouring industrial areas. Safely packaged for electronics.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400">
                <span>✓ Same day delivery available</span>
              </div>
            </div>

            {/* Card 2: 100% Secure Payment */}
            <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-emerald-500/15">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                🔒
              </div>
              <h3 className="mt-5 text-lg font-black text-white group-hover:text-emerald-400 transition-colors">
                100% Secure Payment
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Encrypted Razorpay checkout, UPI QR scan, NEFT/RTGS bank transfer, or Pay on Delivery options.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <span>✓ 256-bit SSL encrypted</span>
              </div>
            </div>

            {/* Card 3: 100% Genuine & Easy Returns */}
            <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-purple-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-purple-500/15">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                🛡️
              </div>
              <h3 className="mt-5 text-lg font-black text-white group-hover:text-purple-400 transition-colors">
                100% Genuine Warranty
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Direct official brand warranty on HP, Asus, Dell, Canon & CP Plus with GST tax invoice provided.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-400">
                <span>✓ Official brand guarantee</span>
              </div>
            </div>

            {/* Card 4: 24/7 Dedicated Support */}
            <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-amber-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-amber-500/15">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                🎧
              </div>
              <h3 className="mt-5 text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                24/7 Local Support
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Get instant product guidance, bulk quotation, or technical assistance via phone or WhatsApp.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                <span>✓ WhatsApp & Call: 96493 74696</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ReviewCard({ review }) {
  return (
    <article className="review-card rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-slate-900">{review.name}</strong>
        <span className="text-amber-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{review.text}</p>
      <span className="mt-4 block text-xs font-black uppercase tracking-wider text-blue-500">Super Mart community</span>
    </article>
  );
}

export default Home;