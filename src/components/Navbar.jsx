import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar({ cartCount = 0, wishlistCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const productCategories = [
    { name: "Laptops", icon: "💻", path: "/products/Laptop" },
    { name: "Desktop & PC", icon: "🖥️", path: "/products/Desktop" },
    { name: "Printers", icon: "🖨️", path: "/products/Printers" },
    { name: "CCTV & Security", icon: "📹", path: "/products/Security" },
    { name: "Networking", icon: "🌐", path: "/products/Networking" },
    { name: "Cables", icon: "🔌", path: "/products/Cable" },
    { name: "Storage", icon: "💾", path: "/products/Storage" },
    { name: "Displays", icon: "🖥️", path: "/products/Display" },
    { name: "Software", icon: "💿", path: "/products/Software" },
    { name: "Accessories", icon: "🎧", path: "/products/Accessories" },
    { name: "Telecom", icon: "☎️", path: "/products/Telecom" },
  ];

  const handleSearch = (e) => {
    e.preventDefault();

    if (!search.trim()) return;

    navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-md">

      {/* Top Announcement Bar */}
    


      {/* Main Navbar */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex min-h-[72px] items-center justify-between gap-4">

          {/* Logo */}
          <Link
            to="/"
            className="group shrink-0 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl"
          >
            <span className="transition-colors duration-300 group-hover:text-indigo-700 text-blue-600">
              Super 
            </span>
             Mart
          </Link>

          {/* Desktop Search */}
          <form
            onSubmit={handleSearch}
            className={`
              hidden flex-1 md:flex
              max-w-xl
              items-center
              rounded-full
              border
              bg-gray-50
              px-4
              py-2
              transition-all
              duration-500
              ease-out
              ${searchOpen
                ? "scale-[1.02] border-blue-500 bg-white shadow-lg shadow-blue-100"
                : "border-gray-200 shadow-sm"
              }
            `}
          >
            <span
              className={`mr-3 text-xl transition-transform duration-500 ${searchOpen ? "rotate-12 scale-110" : ""
                }`}
            >
              🔍
            </span>

            <input
              type="text"
              value={search}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search laptops, mobiles, cameras..."
              className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />

            <button
              type="submit"
              className="
                rounded-full
                bg-blue-600
                px-5
                py-2
                text-sm
                font-semibold
                text-white
                transition-all
                duration-300
                hover:scale-105
                hover:bg-blue-700
                active:scale-95
              "
            >
              Search
            </button>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* WhatsApp */}
            <a
              href="https://wa.me/919549092686"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="
                hidden
                rounded-full
                p-2.5
                text-2xl
                transition-all
                duration-300
                hover:-translate-y-1
                hover:bg-green-50
                hover:scale-110
                sm:block
              "
            >
              <img
                className="w-5 h-5 object-contain"
                src="/img/whatsapp.png"
                alt="Call"
              />
            </a>

            {/* Call */}
            <a
              href="tel:+919549092686"
              aria-label="Call SuperMart"
              className="
                hidden
                rounded-full
                p-2.5
                text-xl
                transition-all
                duration-300
                hover:-translate-y-1
                hover:bg-blue-50
                hover:scale-110
                sm:block
              "
            >
              <img
                className="w-5 h-5 object-contain"
                src="/img/call.png"
                alt="Call"
              />

            </a>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="
                relative
                rounded-full
                p-2.5
                text-2xl
                text-gray-700
                transition-all
                duration-300
                hover:-translate-y-1
                hover:bg-red-50
                hover:text-red-500
              "
            >
              ♡

              {wishlistCount > 0 && (
                <span
                  className="
                    absolute
                    -right-0.5
                    -top-0.5
                    flex
                    h-5
                    min-w-5
                    animate-bounce
                    items-center
                    justify-center
                    rounded-full
                    bg-red-500
                    px-1
                    text-[10px]
                    font-bold
                    text-white
                  "
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              aria-label="Shopping cart"
              className="
                relative
                rounded-full
                p-2.5
                text-xl
                text-gray-700
                transition-all
                duration-300
                hover:-translate-y-1
                hover:bg-blue-50
                hover:text-blue-600
              "
            >
              🛒

              {cartCount > 0 && (
                <span
                  className="
                    absolute
                    -right-0.5
                    -top-0.5
                    flex
                    h-5
                    min-w-5
                    animate-bounce
                    items-center
                    justify-center
                    rounded-full
                    bg-blue-600
                    px-1
                    text-[10px]
                    font-bold
                    text-white
                  "
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              className="
                ml-1
                rounded-xl
                p-2
                text-2xl
                text-gray-800
                transition-all
                duration-300
                hover:bg-gray-100
                md:hidden
              "
            >
              <span
                className={`block transition-transform duration-300 ${menuOpen ? "rotate-90" : ""
                  }`}
              >
                {menuOpen ? "✕" : "☰"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden border-t border-gray-100 md:block">
        <nav className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-4">

          <Link
            to="/"
            className="relative py-4 font-medium text-gray-700 transition-colors duration-300 hover:text-blue-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full"
          >
            Home
          </Link>

          {/* Products Mega Menu */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              className="
                flex
                items-center
                gap-1
                py-4
                font-medium
                text-gray-700
                transition-colors
                duration-300
                hover:text-blue-600
              "
            >
              Products
              <span
                className={`text-xs transition-transform duration-300 ${productsOpen ? "rotate-180" : ""
                  }`}
              >
                ▼
              </span>
            </button>

            {/* Mega Dropdown */}
            <div
              className={`
                absolute
                left-1/2
                top-full
                w-[680px]
                -translate-x-1/2
                rounded-2xl
                border
                border-gray-100
                bg-white
                p-6
                shadow-2xl
                transition-all
                duration-300
                ${productsOpen
                  ? "visible translate-y-0 opacity-100"
                  : "invisible -translate-y-3 opacity-0"
                }
              `}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Explore Electronics
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Find everything you need in one place
                  </p>
                </div>

                <Link
                  to="/products"
                  className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-600 hover:text-white"
                >
                  View All →
                </Link>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {productCategories.map((category) => (
                  <Link
                    key={category.name}
                    to={category.path}
                    className="
                      group
                      rounded-xl
                      border
                      border-gray-100
                      bg-gray-50
                      p-4
                      text-center
                      transition-all
                      duration-300
                      hover:-translate-y-1
                      hover:border-blue-200
                      hover:bg-blue-50
                      hover:shadow-md
                    "
                  >
                    <div
                      className="
                        mb-2
                        text-3xl
                        transition-transform
                        duration-300
                        group-hover:scale-125
                        group-hover:rotate-6
                      "
                    >
                      {category.icon}
                    </div>

                    <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-600">
                      {category.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            to="/products/Laptop"
            className="py-4 font-medium text-gray-700 transition hover:text-blue-600"
          >
            Laptops
          </Link>

          <Link
            to="/products/Desktop"
            className="py-4 font-medium text-gray-700 transition hover:text-blue-600"
          >
            Desktop
          </Link>

          <Link
            to="/products/Printers"
            className="py-4 font-medium text-gray-700 transition hover:text-blue-600"
          >
            Printers
          </Link>

          <Link
            to="/products/Security"
            className="py-4 font-medium text-gray-700 transition hover:text-blue-600"
          >
            CCTV
          </Link>

        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        className={`
          overflow-hidden
          border-t
          border-gray-100
          bg-white
          transition-all
          duration-500
          md:hidden
          ${menuOpen
            ? "max-h-[700px] opacity-100"
            : "max-h-0 opacity-0"
          }
        `}
      >
        <div className="px-4 pb-5 pt-4">

          {/* Mobile Search */}
          <form
            onSubmit={handleSearch}
            className="
              mb-4
              flex
              items-center
              rounded-xl
              border
              border-gray-200
              bg-gray-50
              px-3
              py-2
              transition
              focus-within:border-blue-500
              focus-within:bg-white
              focus-within:shadow-md
            "
          >
            <span className="mr-2 text-lg">🔍</span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent py-2 text-sm outline-none"
            />

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Search
            </button>
          </form>

          {/* Mobile Links */}
          <nav className="flex flex-col">

            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="border-b border-gray-100 px-2 py-3 font-medium text-gray-700 transition hover:bg-blue-50 hover:pl-4 hover:text-blue-600"
            >
              🏠 Home
            </Link>

            {/* Mobile Products */}
            <div className="border-b border-gray-100">
              <button
                onClick={() => setProductsOpen(!productsOpen)}
                className="flex w-full items-center justify-between px-2 py-3 font-medium text-gray-700"
              >
                <span>🛍️ Products</span>

                <span
                  className={`transition-transform duration-300 ${productsOpen ? "rotate-180" : ""
                    }`}
                >
                  ▼
                </span>
              </button>

              <div
                className={`grid overflow-hidden transition-all duration-300 ${productsOpen
                  ? "max-h-[600px] grid-cols-2 gap-2 pb-3"
                  : "max-h-0"
                  }`}
              >
                {productCategories.map((category) => (
                  <Link
                    key={category.name}
                    to={category.path}
                    onClick={() => setMenuOpen(false)}
                    className="
                      rounded-xl
                      bg-gray-50
                      p-3
                      text-center
                      transition
                      hover:bg-blue-50
                    "
                  >
                    <div className="text-2xl">{category.icon}</div>
                    <div className="mt-1 text-xs font-medium text-gray-700">
                      {category.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <Link
              to="/wishlist"
              onClick={() => setMenuOpen(false)}
              className="border-b border-gray-100 px-2 py-3 font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-500"
            >
              ❤️ Wishlist
              {wishlistCount > 0 && ` (${wishlistCount})`}
            </Link>

            <Link
              to="/cart"
              onClick={() => setMenuOpen(false)}
              className="border-b border-gray-100 px-2 py-3 font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
            >
              🛒 Cart
              {cartCount > 0 && ` (${cartCount})`}
            </Link>



            {/* Mobile Contact Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-3">

              <a
                href="https://wa.me/919549092686"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-green-500
                  py-3
                  text-sm
                  font-bold
                  text-white
                  shadow-md
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:bg-green-600
                "
              >
                <img
                  className="w-5 h-5 object-contain"
                  src="/img/whatsapp.png"
                  alt="Call"
                /> WhatsApp
              </a>

              <a
                href="tel:+919549092686"
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  py-3
                  text-sm
                  font-bold
                  text-white
                  shadow-md
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:bg-blue-700
                "
              >
                <img
                  className="w-5 h-5 object-contain"
                  src="/img/call.png"
                  alt="Call"
                /> Call Now
              </a>

            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
