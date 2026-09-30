import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { addToCart } from "@/redux/reducer/cartReducer";
import { RootState } from "@/redux/store";
import { Product } from "@/types/types";

// Adds to an existing line for the same product + size instead of replacing it,
// never going past the stock shared by all sizes of the product.
export const useAddToCart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cartReducer.cartItems);

  return (product: Product, size: string, quantity = 1) => {
    if (product.stock < 1) {
      toast.error("This item is sold out");
      return false;
    }
    if (product.sizes?.length && !size) {
      toast.error("Please select a size");
      return false;
    }

    const inCart = cartItems
      .filter((i) => i.productId === product._id)
      .reduce((sum, i) => sum + i.quantity, 0);
    const line = cartItems.find((i) => i.productId === product._id && i.size === size);
    const addable = Math.min(quantity, product.stock - inCart);

    if (addable < 1) {
      toast.error(`Only ${product.stock} available — they're all in your bag`);
      return false;
    }

    dispatch(
      addToCart({
        productId: product._id,
        size,
        name: product.name,
        price: product.price,
        photo: product.photos[0]?.url ?? "",
        stock: product.stock,
        quantity: (line?.quantity ?? 0) + addable,
      })
    );
    toast.success(
      `Added to bag${size ? ` · Size ${size}` : ""}${addable < quantity ? ` (only ${addable} left)` : ""}`
    );
    return true;
  };
};
