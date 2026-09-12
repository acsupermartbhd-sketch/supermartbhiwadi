import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import categories from "../data/categories";
import { firebaseAuth } from "../data/firebase";
import { FaLocationDot } from "react-icons/fa6";

function NavbarResponsive({ customerSession, onLogout, cartCount = 0, wishlistCount = 0, onContactClick, onWhatsAppClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [navCategories, setNavCategories] = useState(categories);
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navRef = useRef(null);
  const navigate = useNavigate();

  const closeMenu = () => {
    setMenuOpen(false);
    setCategoriesOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) closeMenu();
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearching(true);
    const query = search.trim();
    if (!query) {
      navigate("/products");
      window.setTimeout(() => setSearching(false), 650);
      return;
    }
    navigate(`/products?search=${encodeURIComponent(query)}`);
    closeMenu();
    window.setTimeout(() => setSearching(false), 650);
  };

  const categoryLink = (category) => `/products/${category.replace(" ", "-")}`;
  const dropCategory = (targetIndex) => {
    if (draggedCategory === null || draggedCategory === targetIndex) return;
    setNavCategories((current) => {
      const next = [...current];
      const [moved] = next.splice(draggedCategory, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggedCategory(null);
  };

  return (
    <header ref={navRef} className={`nav-shell sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur ${scrolled ? "nav-scrolled" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-[68px] items-center gap-3">
          <Link to="/" onClick={closeMenu} className="shrink-0 leading-none" aria-label="Super Mart home">
            <span className="flex items-center gap-2 text-2xl font-black tracking-[-.06em] text-slate-950 sm:text-[1.75rem]"><img src="/img/logo.svg" alt="" className="size-9 object-contain sm:size-10" /><span className="nav-brand-label">Super <span className="text-blue-600">Mart</span></span></span>
          </Link>

          <form onSubmit={handleSearch} className={`nav-search desktop-search ml-auto hidden h-12 max-w-2xl flex-1 items-center rounded-2xl border bg-slate-50 px-3 md:flex ${searchFocused ? "is-focused" : ""} ${searching ? "is-searching" : ""}`}>
            <span className="search-symbol search-symbol-desktop mr-2 text-lg" aria-hidden="true">⌕</span>
            <input value={search} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} onChange={(event) => setSearch(event.target.value)} placeholder="Search laptops, printers, CCTV cameras..." aria-label="Search products" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
            <kbd className="search-shortcut">⌘ K</kbd>
            <button type="submit" className="search-button search-button-desktop"><span>{searching ? "Searching..." : "Search"}</span><i aria-hidden="true">→</i></button>
          </form>
          <div className="hidden shrink-0 items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 xl:flex" aria-label="Store location"><FaLocationDot /> FGF 19-20, Capital High Street, Bhiwadi</div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:ml-4">
            <a href="https://wa.me/919549092686" onClick={onWhatsAppClick} target="_blank" rel="noreferrer" className="whatsapp-live hidden items-center gap-2 rounded-xl px-3 py-2 text-emerald-600 transition hover:bg-emerald-50 lg:flex" aria-label="Chat with Super Mart on WhatsApp">
              <img src="/img/whatsapp.png" alt="" className="size-5 object-contain" />
              <span className="text-xs font-black">WhatsApp</span><i className="whatsapp-indicator" aria-hidden="true" />
            </a>
            <a href="tel:+919549092686" onClick={onContactClick} className="hidden items-center gap-2 rounded-lg px-2 py-2 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 lg:flex" aria-label="Call Super Mart">
              <span className="text-lg">☎</span><span className="text-xs font-bold">Call us</span>
            </a>
            <Link to="/wishlist" onClick={closeMenu} className="nav-icon hidden md:inline-flex" aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`}>
              <span aria-hidden="true">♡</span>{wishlistCount > 0 && <b className="nav-badge bg-rose-500">{wishlistCount}</b>}
            </Link>
            <Link to="/cart" onClick={closeMenu} className="nav-icon" aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}>
              <span aria-hidden="true">🛒</span>{cartCount > 0 && <b className="nav-badge bg-blue-600">{cartCount}</b>}
            </Link>
            <AuthActions closeMenu compact customerSession={customerSession} onLogout={onLogout} profileOpen={profileOpen} setProfileOpen={setProfileOpen} />
            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="menu-toggle ml-1 flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 md:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
              <span className={`menu-toggle-lines ${menuOpen ? "is-open" : ""}`} aria-hidden="true"><i /><i /><i /></span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className={`nav-search mobile-search flex h-12 items-center rounded-xl border bg-slate-50 px-3 md:hidden ${searchFocused ? "is-focused" : ""} ${searching ? "is-searching" : ""}`}>
          <span className="search-symbol mr-2 text-lg" aria-hidden="true">⌕</span>
          <input value={search} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." aria-label="Search products" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
          <button type="submit" className="search-button" aria-label="Search products"><span>{searching ? "..." : "Search"}</span><i aria-hidden="true">→</i></button>
        </form>

        <div className="desktop-nav hidden items-center justify-between border-t border-slate-100 md:flex">
          <nav className="flex items-center gap-7" aria-label="Main navigation">
            <Link to="/" className="nav-link">Home</Link>
            <div className="relative">
              <button type="button" onClick={() => setCategoriesOpen((open) => !open)} className={`nav-link flex items-center gap-1 ${categoriesOpen ? "text-blue-600" : ""}`} aria-expanded={categoriesOpen}>
                Shop categories <span className={`text-[10px] transition ${categoriesOpen ? "rotate-180" : ""}`}>▼</span>
              </button>
              {categoriesOpen && <div className="category-dropdown absolute left-0 top-full z-50 mt-1 grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
                {navCategories.map((category, index) => <div key={category.name} draggable onDragStart={() => setDraggedCategory(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropCategory(index)} className="rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"><div className="flex cursor-grab items-center gap-2 text-sm font-black text-slate-800"><span className="text-xl">{category.icon}</span>{category.name}<span className="ml-auto text-xs text-slate-400">⋮⋮</span></div><div className="mt-2 space-y-1">{category.children.map((child) => <Link key={child} to={categoryLink(child)} onClick={closeMenu} className="block rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white hover:text-blue-700">{child}</Link>)}</div></div>)}
                <Link to="/products" onClick={closeMenu} className="col-span-2 rounded-xl bg-blue-600 px-3 py-2.5 text-center text-sm font-black text-white hover:bg-blue-700">View all products →</Link>
              </div>}
            </div>
            {navCategories.filter((category) => ["Laptops & PC", "Printers", "CCTV Cameras"].includes(category.name)).map((category) => <div key={category.name} className="relative" onMouseEnter={() => setHoveredCategory(category.name)} onMouseLeave={() => setHoveredCategory(null)}><Link to={categoryLink(category.children[0])} className="nav-link flex items-center gap-1">{category.name === "Laptops & PC" ? "Laptops & PC" : category.name}<span className="text-[10px]">▼</span></Link>{hoveredCategory === category.name && <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">{category.children.map((child) => <Link key={child} to={categoryLink(child)} className="block rounded-lg px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">{child}</Link>)}</div>}</div>)}
            <Link to="/products/Accessories" className="nav-link">Accessories</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
          </nav>
        </div>
      </div>

      <div className={`mobile-menu-panel overflow-x-hidden border-t border-slate-100 bg-white transition-[max-height,opacity] duration-300 md:hidden ${menuOpen ? "max-h-[calc(100dvh-120px)] overflow-y-auto opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="mx-auto max-w-7xl px-4 pb-5 pt-4 sm:px-6">
          <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">⌖ FG 19-20, Capital High Street, Bhiwadi, Alwar, Rajasthan 301019</div>
          <nav className="mt-3 grid gap-1" aria-label="Mobile navigation">
            <Link to="/" onClick={closeMenu} className="mobile-link">⌂ <span>Home</span></Link>
            <button type="button" onClick={() => setCategoriesOpen((open) => !open)} className="mobile-link w-full justify-between"><span>▦ <span>Shop categories</span></span><span className={categoriesOpen ? "rotate-180" : ""}>▼</span></button>
            {categoriesOpen && <div className="mobile-category-list grid gap-2 rounded-xl bg-slate-50 p-2">{navCategories.map((category) => <div key={category.name} className="rounded-lg bg-white p-2"><p className="text-xs font-black text-slate-800">{category.icon} {category.name}</p><div className="mt-1 grid grid-cols-2 gap-1">{category.children.map((child) => <Link key={child} to={categoryLink(child)} onClick={closeMenu} className="rounded px-1 py-1 text-[11px] font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700">{child}</Link>)}</div></div>)}</div>}
            <Link to="/cart" onClick={closeMenu} className="mobile-link">🛒 <span>Cart {cartCount > 0 && `(${cartCount})`}</span></Link>
            <Link to="/contact" onClick={closeMenu} className="mobile-link">✉ <span>Contact</span></Link>
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2"><a href="https://wa.me/919549092686" onClick={onWhatsAppClick} target="_blank" rel="noreferrer" className="mobile-action-button flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-white"><img src="/img/whatsapp.png" alt="" className="size-5 object-contain" />WhatsApp</a><a href="tel:+919549092686" onClick={onContactClick} className="mobile-action-button flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white"><span aria-hidden="true">☎</span> Call now</a></div>
        </div>
      </div>
    </header>
  );
}

function AuthActions({ closeMenu, mobile = false, compact = false, customerSession, onLogout, profileOpen, setProfileOpen }) {
  if (customerSession) return <div className="profile-menu-wrap"><button type="button" onClick={() => setProfileOpen((open) => !open)} className="profile-action" aria-label="Open profile menu" aria-expanded={profileOpen}><span className="profile-avatar">{customerSession.name?.charAt(0)?.toUpperCase() || "U"}</span></button>{profileOpen && <div className="profile-menu"><p className="profile-menu-name">{customerSession.name || "Customer"}</p><p className="profile-menu-email">{customerSession.email}</p>{customerSession.phone && <p className="profile-menu-detail">☎ {customerSession.phone}</p>}{customerSession.address && <p className="profile-menu-detail">⌖ {customerSession.address}</p>}<Link to="/orders" onClick={() => { setProfileOpen(false); closeMenu(); }} className="profile-orders-link">View my orders</Link><button type="button" onClick={async () => { await signOut(firebaseAuth); setProfileOpen(false); onLogout(); closeMenu(); }} className="profile-logout">Log out</button></div>}</div>;
  return <div className={`auth-actions ${mobile ? "auth-actions-mobile" : ""} ${compact ? "auth-actions-compact" : ""}`}><Link to="/login?mode=login" onClick={closeMenu} className="auth-login-button"><span className="auth-person-icon" aria-hidden="true" /> Login</Link></div>;
}

export default NavbarResponsive;
