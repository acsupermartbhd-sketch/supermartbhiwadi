import { useParams, useSearchParams } from "react-router-dom";
import ProductCard from "./ProductCard";
function Products({ products, addToCart, addToWishlist }) {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      !category ||
      product.category.toLowerCase() === category.toLowerCase();

    const query = search.trim().toLowerCase();
    const productText = `${product.name} ${product.category} ${product.description || ""}`.toLowerCase();
    const queryWords = query.split(/\s+/).filter(Boolean);
    const isPrinterSearch = query.includes("printer") || query.includes("toner") || query.includes("cartridge") || query.includes("ink");
    const matchesSearch = !query || productText.includes(query) || queryWords.every((word) => productText.includes(word)) || (isPrinterSearch && product.category.toLowerCase().includes("printer"));

    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-10">
          <p className="font-semibold text-blue-600">
            SUPERMART STORE
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            {search ? `Search results for "${search}"` : category || "All Products"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"} found</p>
        </div>

        {/* Products */}
        {filteredProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                addToCart={addToCart}
                addToWishlist={addToWishlist}
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
              Try searching for another product.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default Products;