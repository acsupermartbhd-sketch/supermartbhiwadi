import ProductCard from "./ProductCard";

function Wishlist({ wishlist, addToCart, addToWishlist }) {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-6">

        <h1 className="text-4xl font-bold">
          My Wishlist ❤️
        </h1>

        {wishlist.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-20 text-center">
            <div className="text-6xl">♡</div>

            <h2 className="mt-4 text-2xl font-bold">
              Your Wishlist is Empty
            </h2>

            <p className="mt-2 text-gray-500">
              Save products you love here.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {wishlist.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                addToCart={addToCart}
                addToWishlist={addToWishlist}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

export default Wishlist;