import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import categories from "../data/categories";
import { firebaseAuth } from "../data/firebase";
import { FaLocationDot } from "react-icons/fa6";

function NavbarResponsive({ customerSession, onLogout, cartCount = 0, wishlistCount = 0, onContactClick, onWhatsAppClick, onEditProfile }) {
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
        <div className="flex min-h-17 items-center gap-3">
          <Link to="/" onClick={closeMenu} className="nav-brand shrink-0 leading-none" aria-label="Super Mart home">
            <span className="nav-brand-inner flex items-center gap-2 text-2xl font-black tracking-[-.06em] text-slate-950 sm:text-[1.75rem]"><img src="/img/logo.svg" alt="" className="nav-brand-mark size-9 object-contain sm:size-10" /><span className="nav-brand-label">Super <span className="nav-brand-accent text-blue-600">Mart</span></span></span>
          </Link>

          <form onSubmit={handleSearch} className={`nav-search desktop-search ml-auto hidden h-12 max-w-2xl flex-1 items-center rounded-2xl border bg-slate-50 px-3 md:flex ${searchFocused ? "is-focused" : ""} ${searching ? "is-searching" : ""}`}>
            <span className="search-symbol search-symbol-desktop mr-2 text-lg" aria-hidden="true">⌕</span>
            <input value={search} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} onChange={(event) => setSearch(event.target.value)} placeholder="Search laptops, printers, CCTV cameras..." aria-label="Search products" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
            <kbd className="search-shortcut">⌘ K</kbd>
            <button type="submit" className="search-button search-button-desktop"><span>{searching ? "Searching..." : "Search"}</span><i aria-hidden="true">→</i></button>
          </form>
          <div className="store-location hidden shrink-0 items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 xl:flex" aria-label="Store location"><FaLocationDot /> FGH 12A, Capital High Street, Bhiwadi</div>

          <div className="nav-actions ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:ml-4">
            <a href="https://wa.me/919549092686" onClick={onWhatsAppClick} target="_blank" rel="noreferrer" className="whatsapp-live nav-secondary-action hidden items-center gap-2 rounded-xl px-3 py-2 text-emerald-600 transition hover:bg-emerald-50 lg:flex" aria-label="Chat with Super Mart on WhatsApp">
              <img src="/img/whatsapp.png" alt="" className="size-5 object-contain" />
              <span className="nav-action-label text-xs font-black">WhatsApp</span><i className="whatsapp-indicator" aria-hidden="true" />
            </a>
            <a href="tel:+919549092686" onClick={onContactClick} className="nav-secondary-action hidden items-center gap-2 rounded-lg px-2 py-2 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 lg:flex" aria-label="Call Super Mart">
              <span className="nav-action-icon text-lg">☎</span><span className="nav-action-label text-xs font-bold">Call us</span>
            </a>
            <Link to="/wishlist" onClick={closeMenu} className="nav-icon hidden md:inline-flex" aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`}>
              <span aria-hidden="true">♡</span>{wishlistCount > 0 && <b className="nav-badge bg-rose-500">{wishlistCount}</b>}
            </Link>
            <Link to="/cart" onClick={closeMenu} className="nav-icon" aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}>
              <span aria-hidden="true">🛒</span>{cartCount > 0 && <b className="nav-badge bg-blue-600">{cartCount}</b>}
            </Link>
            <AuthActions closeMenu={closeMenu} compact customerSession={customerSession} onLogout={onLogout} profileOpen={profileOpen} setProfileOpen={setProfileOpen} onEditProfile={onEditProfile} />
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
            {navCategories.map((category, index) => <div key={category.name} className="relative shrink-0" draggable onDragStart={() => setDraggedCategory(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropCategory(index)} onMouseEnter={() => setHoveredCategory(category.name)} onMouseLeave={() => setHoveredCategory(null)}><Link to={categoryLink(category.children[0])} className="nav-link flex items-center gap-1">{category.name}<span className="nav-caret" aria-hidden="true">⌄</span></Link>{hoveredCategory === category.name && <div className={`category-dropdown desktop-category-dropdown absolute top-full z-50 mt-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl ${index < 4 ? "dropdown-align-start" : index >= navCategories.length - 2 ? "dropdown-align-end" : ""}`} role="menu"><div className="category-dropdown-heading"><span className="category-dropdown-icon">{category.icon}</span><div><strong>{category.name}</strong><small>Explore {category.name.toLowerCase()} products</small></div></div><div className="category-dropdown-grid">{category.children.map((child) => <Link key={child} to={categoryLink(child)} onClick={closeMenu} className="category-dropdown-item" role="menuitem"><span>{child}</span><b aria-hidden="true">→</b></Link>)}</div><Link to={categoryLink(category.children[0])} onClick={closeMenu} className="category-dropdown-footer">View all {category.name} products <span aria-hidden="true">→</span></Link></div>}</div>)}
            <Link to="/contact" className="nav-link">Contact</Link>
          </nav>
        </div>
      </div>

      <div className={`mobile-menu-panel border-t border-slate-100 bg-white md:hidden ${menuOpen ? "is-open" : "is-closed"}`}>
        <div className="mx-auto max-w-7xl px-4 pb-5 pt-4 sm:px-6">
          <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">⌖ FGH 12A, Capital High Street, Bhiwadi, Alwar, Rajasthan 301019</div>
          <nav className="mt-3 grid gap-1" aria-label="Mobile navigation">
            <Link to="/" onClick={closeMenu} className="mobile-link">⌂ <span>Home</span></Link>
            <button type="button" onClick={() => setCategoriesOpen((open) => !open)} className="mobile-link w-full justify-between"><span>▦ <span>Shop categories</span></span><span className={categoriesOpen ? "rotate-180" : ""}>▼</span></button>
            {categoriesOpen && <div className="mobile-category-list grid gap-2 rounded-xl bg-slate-50 p-2">{navCategories.map((category) => <div key={category.name} className="mobile-category-card"><p className="mobile-category-title"><span>{category.icon}</span>{category.name}<small>{category.children.length} items</small></p><div className="mobile-category-items">{category.children.map((child) => <Link key={child} to={categoryLink(child)} onClick={closeMenu} className="mobile-category-item">{child}<span aria-hidden="true">→</span></Link>)}</div></div>)}</div>}
            <Link to="/cart" onClick={closeMenu} className="mobile-link">🛒 <span>Cart {cartCount > 0 && `(${cartCount})`}</span></Link>
            <Link to="/contact" onClick={closeMenu} className="mobile-link">✉ <span>Contact</span></Link>
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2"><a href="https://wa.me/919549092686" onClick={onWhatsAppClick} target="_blank" rel="noreferrer" className="mobile-action-button flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-white"><img src="/img/whatsapp.png" alt="" className="size-5 object-contain" />WhatsApp</a><a href="tel:+919549092686" onClick={onContactClick} className="mobile-action-button flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white"><span aria-hidden="true">☎</span> Call now</a></div>
        </div>
      </div>
    </header>
  );
}

function AuthActions({ closeMenu, mobile = false, compact = false, customerSession, onLogout, profileOpen, setProfileOpen, onEditProfile }) {
  const isPartner = customerSession?.role === "partner";

  if (customerSession) return (
    <div className="profile-menu-wrap">
      {/* Avatar button – golden ring for partners */}
      <button
        type="button"
        onClick={() => setProfileOpen((open) => !open)}
        className={`profile-action${isPartner ? " is-partner" : ""}`}
        aria-label="Open profile menu"
        aria-expanded={profileOpen}
        title={isPartner ? "★ B2B Partner Account" : customerSession.name || "My Account"}
      >
        <span className="profile-avatar">
          {customerSession.name?.charAt(0)?.toUpperCase() || "U"}
        </span>
      </button>

      {/* Partner badge pill shown next to avatar */}
      {isPartner && (
        <span className="partner-badge" aria-label="B2B Partner">
          ★ Partner
        </span>
      )}

      {/* Dropdown menu */}
      {profileOpen && (
        <div className="profile-menu">
          <p className="profile-menu-name">{customerSession.name || "Customer"}</p>
          <p className="profile-menu-email">{customerSession.email}</p>
          {customerSession.phone && <p className="profile-menu-detail">☎ {customerSession.phone}</p>}
          {customerSession.address && <p className="profile-menu-detail">⌖ {customerSession.address}</p>}

          {/* Partner exclusive card in dropdown */}
          {isPartner && (
            <div className="profile-partner-card">
              <p className="profile-partner-card-title">★ B2B Wholesale Partner</p>
              <p className="profile-partner-card-desc">You enjoy exclusive wholesale pricing across all products.</p>
            </div>
          )}

          <Link to="/orders" onClick={() => { setProfileOpen(false); closeMenu(); }} className="profile-orders-link">
            View my orders
          </Link>
          <button
            type="button"
            onClick={() => { setProfileOpen(false); closeMenu(); onEditProfile?.(); }}
            className="w-full mt-1 px-3 py-2 rounded-xl text-xs font-bold text-left text-blue-700 bg-blue-50 hover:bg-blue-100 transition flex items-center gap-2"
          >
            ✏️ Edit Profile &amp; Address
          </button>
          <button
            type="button"
            onClick={async () => { await signOut(firebaseAuth); setProfileOpen(false); onLogout(); closeMenu(); }}
            className="profile-logout"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={`auth-actions ${mobile ? "auth-actions-mobile" : ""} ${compact ? "auth-actions-compact" : ""}`}>
      <Link to="/login?mode=login" onClick={closeMenu} className="auth-login-button">
        <span className="auth-person-icon" aria-hidden="true" /> Login
      </Link>
    </div>
  );
}

export default NavbarResponsive;
