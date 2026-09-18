import { useParams, useSearchParams } from "react-router-dom";
import ProductCard from "./ProductCard";
import categories from "../data/categories";

function stemWord(w) {
  if (!w) return "";
  let s = String(w).toLowerCase().trim();
  if (s.endsWith("ies")) return s.slice(0, -3) + "y";
  if (s.endsWith("es") && !s.endsWith("tes") && !s.endsWith("des") && !s.endsWith("les")) return s.slice(0, -2);
  if (s.endsWith("s") && !s.endsWith("ss") && !s.endsWith("us") && !s.endsWith("is")) return s.slice(0, -1);
  return s;
}

function cleanTokens(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[-_/\\&,()+]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function normalizeKey(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[-_/\\&,()+]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(stemWord)
    .join(" ");
}

function matchesCategoryFilter(product, categoryParam) {
  if (!categoryParam) return true;

  const rawParam = decodeURIComponent(categoryParam).trim();
  const paramKey = normalizeKey(rawParam);
  const paramTokens = cleanTokens(rawParam);
  const paramStems = paramTokens.map(stemWord);

  const prodCat = String(product.category || "").trim();
  const prodCatKey = normalizeKey(prodCat);
  const prodCatTokens = cleanTokens(prodCat);
  const prodCatStems = prodCatTokens.map(stemWord);

  const prodName = String(product.name || "").trim();
  const prodNameKey = normalizeKey(prodName);
  const prodNameTokens = cleanTokens(prodName);
  const prodNameStems = prodNameTokens.map(stemWord);

  // Classification flags
  const isCableProduct =
    prodCatStems.includes("cable") ||
    prodCatTokens.some((t) => t.includes("cable")) ||
    prodNameStems.includes("cable") ||
    prodNameTokens.some((t) => t.includes("cable")) ||
    prodName.toLowerCase().includes("data cable") ||
    prodName.toLowerCase().includes("hdmi") ||
    prodName.toLowerCase().includes("patch cord") ||
    prodName.toLowerCase().includes("power cord");

  const isDesktopSwitch =
    prodName.toLowerCase().includes("desktop switch") ||
    prodCat.toLowerCase().includes("desktop switch");

  // Detect filter type
  const isDesktopFilter =
    paramKey === "desktop" ||
    (paramStems.includes("desktop") && !paramStems.includes("cable") && !paramStems.includes("switch"));

  const isCableFilter =
    paramKey === "cable" ||
    paramKey === "cables" ||
    paramKey === "cable connector" ||
    paramKey === "cables connector" ||
    paramKey.includes("cable") ||
    paramStems.includes("cable");

  const isLaptopFilter =
    paramKey === "laptop" || paramKey === "laptops" || paramStems.includes("laptop");

  const isNetworkingFilter =
    paramKey === "networking" || paramStems.includes("network");

  // STRICT COLLISION PREVENTION:
  // 1. Data cables and cords must NEVER appear in Desktop or Laptop
  if ((isDesktopFilter || isLaptopFilter) && isCableProduct) {
    return false;
  }
  // 2. Desktop switches belong to Networking, not Desktop PC
  if (isDesktopFilter && isDesktopSwitch) {
    return false;
  }
  // 3. Desktop computers / CPUs / parts must NEVER appear in Cables
  if (isCableFilter) {
    if (isDesktopSwitch) return false;
    return isCableProduct;
  }

  // Networking includes cables as children
  if (isNetworkingFilter && isCableProduct) return true;

  // Exact normalized stem match between param and product category
  if (paramKey === prodCatKey) return true;

  // Substring / token matching on category
  if (prodCatKey.includes(paramKey) || paramKey.includes(prodCatKey)) return true;

  // Match against categories data structure (Parent -> Children)
  const matchedParent = categories.find((cat) => {
    const parentKey = normalizeKey(cat.name);
    if (parentKey === paramKey) return true;
    if (parentKey.includes(paramKey) || paramKey.includes(parentKey)) return true;
    return false;
  });

  if (matchedParent) {
    // If param is a parent category (e.g. "Desktop", "Laptop", "Printers", "Security", "Accessories")
    const childKeys = matchedParent.children.map(normalizeKey);
    const matchesChild = childKeys.some(
      (ck) => ck === prodCatKey || prodCatKey.includes(ck) || ck.includes(prodCatKey)
    );
    if (matchesChild) {
      if ((isDesktopFilter || isLaptopFilter) && isCableProduct) return false;
      return true;
    }
  }

  // Reverse check: param matches a specific child category
  const matchingChild = categories
    .flatMap((cat) => cat.children)
    .find((child) => normalizeKey(child) === paramKey);

  if (matchingChild) {
    const childKey = normalizeKey(matchingChild);
    if (childKey === prodCatKey || prodCatKey.includes(childKey)) {
      if ((isDesktopFilter || isLaptopFilter) && isCableProduct) return false;
      return true;
    }
  }

  // Token stem intersection in product category
  const hasCatStemMatch = paramStems.some(
    (stem) => stem.length >= 3 && (prodCatStems.includes(stem) || prodCatTokens.some((t) => t.includes(stem)))
  );
  if (hasCatStemMatch) {
    if ((isDesktopFilter || isLaptopFilter) && isCableProduct) return false;
    return true;
  }

  // Specific tech categories fallback checks
  if (paramStems.includes("cctv") || paramStems.includes("camera") || paramStems.includes("secur")) {
    if (prodCatStems.includes("camera") || prodNameStems.includes("camera") || prodCatStems.includes("cctv")) {
      return true;
    }
  }

  if (paramStems.includes("printer") || paramStems.includes("scanner") || paramStems.includes("toner")) {
    if (prodCatStems.includes("printer") || prodCatStems.includes("scanner") || prodCatStems.includes("toner") || prodNameStems.includes("printer")) {
      return true;
    }
  }

  if (paramStems.includes("display") || paramStems.includes("monitor")) {
    if (prodCatStems.includes("monitor") || prodCatStems.includes("display") || prodCatStems.includes("led") || prodNameStems.includes("monitor")) {
      return true;
    }
  }

  // Product name match only if not a generic collision
  const hasNameStemMatch = paramStems.some(
    (stem) => stem.length >= 3 && (prodNameStems.includes(stem) || prodNameTokens.some((t) => t.includes(stem)))
  );
  if (hasNameStemMatch) {
    if ((isDesktopFilter || isLaptopFilter) && isCableProduct) return false;
    return true;
  }

  return false;
}

function Products({ products, addToCart, addToWishlist, customerSession }) {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const filteredProducts = products.filter((product) => {
    const matchesCategory = matchesCategoryFilter(product, category);

    const query = search.trim().toLowerCase();
    const productText = `${product.name} ${product.category} ${product.description || ""}`.toLowerCase();
    const queryWords = query.split(/\s+/).filter(Boolean);
    const isPrinterSearch = query.includes("printer") || query.includes("toner") || query.includes("cartridge") || query.includes("ink");
    const matchesSearch = !query || productText.includes(query) || queryWords.every((word) => productText.includes(word)) || (isPrinterSearch && product.category.toLowerCase().includes("printer"));

    return matchesCategory && matchesSearch;
  });

  const displayTitle = search
    ? `Search results for "${search}"`
    : category
      ? decodeURIComponent(category).replace(/[-_/]+/g, " ")
      : "All Products";

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10">
          <p className="font-semibold text-blue-600">
            SUPERMART STORE
          </p>

          <h1 className="mt-2 text-4xl font-bold capitalize text-gray-900">
            {displayTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"} found
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                addToCart={addToCart}
                addToWishlist={addToWishlist}
                customerSession={customerSession}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
            <div className="text-5xl">🔍</div>
            <h2 className="mt-4 text-2xl font-bold">
              No Products Found
            </h2>
            <p className="mt-2 text-gray-500">
              Try searching or exploring other categories.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default Products;