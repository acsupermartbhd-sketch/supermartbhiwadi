import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";

function Home({ products, addToCart, addToWishlist, reviews = [] }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [reviewDirection, setReviewDirection] = useState("down");
  const featuredProducts = products.slice(0, 6);
  const slides = products.slice(0, 3).map((product, index) => ({
    product,
    label: index === 0 ? "Editor's pick" : index === 1 ? "Work smarter" : "New favourite",
    headline: index === 0 ? "Power up your everyday" : index === 1 ? "Tech that keeps up" : "Big upgrades, better value",
  }));
  const storefrontImages = ["/image/main.webp", "/image/main2.webp", "/image/main3.webp", "/image/main4.webp", "/image/main5.webp", "/image/main6.webp"];
  const heroSlides = [...storefrontImages.map((image, index) => ({ ...slides[0], isStorefront: true, image, headline: index === 0 ? "Your trusted Super Mart in Bhiwadi" : "Explore Super Mart in person" })), ...slides.map((slide) => ({ ...slide, image: slide.product.image }))].filter((slide) => slide.product);
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
      icon: "💻",
      link: "/products/Laptops",
      color: "bg-blue-100",
    },
    {
      name: "Printers",
      icon: "🖨️",
      link: "/products/Printers",
      color: "bg-purple-100",
    },
    {
      name: "CCTV Cameras",
      icon: "📹",
      link: "/products/CCTV-Cameras",
      color: "bg-green-100",
    },
    {
      name: "Monitors",
      icon: "🖥️",
      link: "/products/Monitors",
      color: "bg-orange-100",
    },
    {
      name: "Accessories",
      icon: "🎧",
      link: "/products/Accessories",
      color: "bg-pink-100",
    },
  ];

  return (
    <main>

      {/* Hero slider */}
      <section className="home-hero">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-5 sm:px-6 sm:py-8 lg:py-10">
          <div className="relative z-10 flex min-h-[360px] flex-col items-start justify-center rounded-3xl p-6 text-white sm:min-h-[480px] sm:p-10 lg:min-h-[540px] lg:p-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[.18em] text-blue-200">Welcome to SuperMart · Bhiwadi</p>
            <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-[-.04em] sm:text-5xl lg:text-6xl">{heroSlides[visibleSlide]?.isStorefront ? "Your trusted Super Mart in Bhiwadi" : heroSlides[visibleSlide]?.headline || "Upgrade your digital life"}</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-blue-100 sm:text-lg">Reliable laptops, printers, CCTV cameras and accessories with honest prices and quick local delivery.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/products" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50">Shop all products →</Link>
              {heroSlides[visibleSlide] && !heroSlides[visibleSlide].isStorefront && <Link to={`/product/${heroSlides[visibleSlide].product.id}`} className="rounded-xl border border-blue-300/70 px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-blue-700">View this pick</Link>}
            </div>
            <div className="mt-8 flex items-center gap-2" aria-label="Hero slides">
              {heroSlides.map((slide, index) => <button key={`${slide.product.id}-${index}`} type="button" onClick={() => setActiveSlide(index)} aria-label={`Show slide ${index + 1}`} className={`h-2 rounded-full transition-all ${visibleSlide === index ? "w-9 bg-white" : "w-2 bg-blue-300"}`} />)}
            </div>
          </div>
          {heroSlides[visibleSlide] && <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/20 bg-slate-950/30 shadow-2xl">
            <img src={heroSlides[visibleSlide].image} alt={heroSlides[visibleSlide].isStorefront ? "Super Mart storefront in Bhiwadi" : heroSlides[visibleSlide].product.name} loading="eager" fetchPriority="high" decoding="async" className="h-full w-full object-cover brightness-75 transition duration-700" />
          </div>}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-6">

          <div className="mb-10 text-center">
            <p className="eyebrow">Shop by need</p>
            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Shop By Category
            </h2>

            <p className="mt-2 text-gray-500">
              Find the perfect electronics for your needs
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.link}
                className={`${category.color} rounded-2xl p-4 text-center transition hover:-translate-y-1 hover:shadow-lg sm:p-6`}
              >
                <div className="text-4xl sm:text-5xl">{category.icon}</div>

                <h3 className="mt-4 font-bold text-gray-800">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">

          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="font-semibold text-blue-600">
                BEST SELLERS
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                Featured Products
              </h2>
            </div>

            <Link
              to="/products"
              className="font-semibold text-blue-600 hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                addToCart={addToCart}
                addToWishlist={addToWishlist}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="shop-review-section bg-blue-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[.8fr_1.2fr]">
          <div><p className="eyebrow">Super Mart community</p><h2 className="mt-2 text-3xl font-black text-slate-950">What customers say</h2><p className="mt-3 text-slate-600">Real experiences from the Super Mart community.</p><p className="mt-2 text-sm font-semibold text-blue-700">Your feedback helps us serve Bhiwadi better.</p><p className="mt-1 text-sm text-slate-500">Every review helps another shopper buy with confidence.</p><div className="mt-6 flex items-center gap-3"><span className="text-2xl text-amber-500">★★★★★</span><span className="text-sm font-black text-slate-600">Loved by local shoppers</span></div></div>
          <div className="review-stack">{shopReviews.length ? <><div className="review-rail"><div className={`review-marquee-track review-marquee-${reviewDirection}`}>{topReviewLoop.map((review, index) => <ReviewCard key={`${review.id}-top-${index}`} review={review} />)}</div></div>{bottomReviews.length > 0 && <div className="review-rail"><div className={`review-marquee-track review-marquee-${reviewDirection === "down" ? "up" : "down"} review-marquee-slower`}>{bottomReviewLoop.map((review, index) => <ReviewCard key={`${review.id}-bottom-${index}`} review={review} />)}</div></div>}</> : <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 p-8 text-center text-sm text-slate-500">No reviews yet.</div>}</div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-900 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4">

          <div className="text-center">
            <div className="text-4xl">🚚</div>
            <h3 className="mt-3 font-bold">Fast Delivery</h3>
            <p className="mt-1 text-sm text-gray-400">
              Quick and reliable delivery
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl">🔒</div>
            <h3 className="mt-3 font-bold">Secure Payment</h3>
            <p className="mt-1 text-sm text-gray-400">
              100% secure transactions
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl">↩️</div>
            <h3 className="mt-3 font-bold">Easy Returns</h3>
            <p className="mt-1 text-sm text-gray-400">
              Hassle-free return policy
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl">🎧</div>
            <h3 className="mt-3 font-bold">24/7 Support</h3>
            <p className="mt-1 text-sm text-gray-400">
              We're always here to help
            </p>
          </div>

        </div>
      </section>

    </main>
  );
}

function ReviewCard({ review }) {
  return <article className="review-card rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><strong className="text-slate-900">{review.name}</strong><span className="text-amber-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{review.text}</p><span className="mt-4 block text-xs font-black uppercase tracking-wider text-blue-500">Super Mart community</span></article>;
}

export default Home;