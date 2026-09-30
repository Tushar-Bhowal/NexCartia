import Breadcrumb from "@/components/Shared/Breadcrumb";
import { ProductSkeleton } from "@/components/Shared/Loader";
import { Button } from "@/components/ui/button";
import { useProductDetailsQuery } from "@/redux/api/productApi";
import { addToCart } from "@/redux/reducer/cartReducer";
import { RootState } from "@/redux/store";
import { useState } from "react";
import toast from "react-hot-toast";
import { BsCart3 } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { data, isLoading, isError } = useProductDetailsQuery(id!);
  const inCart = useSelector((state: RootState) =>
    state.cartReducer.cartItems.find((i) => i.productId === id)
  );

  const [photoIndex, setPhotoIndex] = useState(0);
  const [quantity, setQuantity] = useState(inCart?.quantity ?? 1);

  if (isLoading)
    return (
      <div className="container mx-auto px-4 pt-28">
        <ProductSkeleton />
      </div>
    );

  if (isError || !data)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 pt-16">
        <p className="text-lg text-gray-700">This product could not be found.</p>
        <Link to="/search" className="text-green-150 underline">
          Browse all products
        </Link>
      </div>
    );

  const { product } = data;
  const photos = product.photos ?? [];
  const inStock = product.stock > 0;
  const maxQuantity = Math.max(1, product.stock);

  const addToCartHandler = () => {
    if (!inStock) return toast.error("Out of Stock");

    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        photo: photos[0]?.url ?? "",
        stock: product.stock,
        quantity: Math.min(quantity, product.stock),
      })
    );
    toast.success(inCart ? "Cart updated" : "Added to cart");
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mt-12">
        <Breadcrumb pageName="Home" currentPage={product.name} />
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
            {photos[photoIndex] && (
              <img
                src={photos[photoIndex].url}
                alt={product.name}
                className="h-full w-full object-cover object-center"
              />
            )}
          </div>

          {photos.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {photos.map((photo, i) => (
                <button
                  key={photo.public_id}
                  type="button"
                  onClick={() => setPhotoIndex(i)}
                  aria-label={`Show photo ${i + 1}`}
                  className={`h-20 w-20 flex-none overflow-hidden rounded-md border-2 ${
                    i === photoIndex ? "border-green-150" : "border-transparent"
                  }`}
                >
                  <img
                    src={photo.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <p className="text-sm uppercase tracking-wider text-gray-500">
            {product.category} · {product.gender === "female" ? "Women" : "Men"}
          </p>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-2xl font-semibold text-gray-900">₹{product.price}</p>

          <p className={inStock ? "text-green-600" : "text-red-600"}>
            {inStock ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {inStock && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">Quantity</span>
              <div className="flex items-center rounded-md border border-gray-300">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  className="px-3 py-1.5 disabled:opacity-40"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => q - 1)}
                >
                  -
                </button>
                <span className="min-w-8 text-center">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  className="px-3 py-1.5 disabled:opacity-40"
                  disabled={quantity >= maxQuantity}
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>
          )}

          <Button
            onClick={addToCartHandler}
            disabled={!inStock}
            className="h-11 w-full gap-2 bg-green-150 text-white hover:bg-green-150/90 sm:w-64"
          >
            <BsCart3 className="h-4 w-4" />
            {inCart ? "Update cart" : "Add to cart"}
          </Button>

          {inCart && (
            <Link to="/cart" className="text-sm text-green-150 underline">
              View cart
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
