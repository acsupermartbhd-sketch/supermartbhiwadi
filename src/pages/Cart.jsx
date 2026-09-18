import { Link } from "react-router-dom";

function Cart({ cart, products = [], updateQuantity, removeFromCart }) {
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-6">

        <h1 className="text-4xl font-bold text-gray-900">
          Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-16 text-center shadow-sm">
            <div className="text-6xl">🛒</div>

            <h2 className="mt-5 text-2xl font-bold">
              Your cart is empty
            </h2>

            <p className="mt-2 text-gray-500">
              Add some products to your cart.
            </p>

            <Link
              to="/products"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-3">

            <div className="space-y-4 lg:col-span-2">
              {cart.map((item) => {
                const prod = products.find((p) => String(p.id) === String(item.id));
                const maxStock = typeof prod?.stock === "number" ? prod.stock : (typeof item.stock === "number" ? item.stock : 999);
                const isMaxStockReached = item.quantity >= maxStock;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-sm sm:flex-row"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="cart-product-image h-32 w-full rounded-xl object-contain sm:w-32"
                    />

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold">
                          {item.name}
                        </h3>

                        <p className="mt-1 text-gray-500">
                          {item.category}
                        </p>

                        {maxStock <= 5 && (
                          <p className="mt-1 text-xs font-bold text-amber-600">
                            Only {maxStock} left in stock
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">

                        <div className="flex items-center rounded-lg border">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="px-4 py-2 hover:bg-slate-50 transition"
                          >
                            −
                          </button>

                          <span className="px-4 font-bold">
                            {item.quantity}
                          </span>

                          <button
                            disabled={isMaxStockReached}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            title={isMaxStockReached ? `Maximum available stock reached (${maxStock})` : "Add one more"}
                            className={`px-4 py-2 transition ${
                              isMaxStockReached
                                ? "opacity-30 cursor-not-allowed bg-slate-100"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            +
                          </button>
                        </div>

                        {isMaxStockReached && (
                          <span className="text-[11px] font-bold text-amber-600">
                            Max ({maxStock})
                          </span>
                        )}

                        <strong className="text-xl">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </strong>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="mt-3 text-left text-sm font-semibold text-red-500 hover:text-red-700 transition cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="h-fit rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">
                Order Summary
              </h2>

              <div className="mt-6 flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>

              <div className="mt-3 flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className="text-green-600">FREE</span>
              </div>

              <hr className="my-5" />

              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>

              <Link to="/checkout" className="mt-6 block w-full rounded-xl bg-blue-600 py-4 text-center font-bold text-white hover:bg-blue-700">
                Proceed to Checkout
              </Link>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}

export default Cart;