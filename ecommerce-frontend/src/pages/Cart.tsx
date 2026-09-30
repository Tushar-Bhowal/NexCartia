import Breadcrumb from "@/components/Shared/Breadcrumb";
import CartItemCard from "@/components/Shared/CartItemCard";
import { Button } from "@/components/ui/button";
import {
  addToCart,
  calculatePrice,
  discountApplied,
  removeCartItem,
  saveCoupon,
} from "@/redux/reducer/cartReducer";
import { useLazyDiscountQuery } from "@/redux/api/paymentApi";
import { CartReducerInitialState } from "@/types/reducer-types";
import { CartItem } from "@/types/types";
import { FormEvent, useEffect, useState } from "react";
import { VscError } from "react-icons/vsc";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Cart = () => {
  const { cartItems, subtotal, tax, total, shippingCharges, discount, coupon } =
    useSelector(
      (state: { cartReducer: CartReducerInitialState }) => state.cartReducer
    );

  const dispatch = useDispatch();

  const [couponCode, setCouponCode] = useState<string>(coupon ?? "");
  const [couponStatus, setCouponStatus] = useState<"valid" | "invalid" | null>(
    coupon ? "valid" : null
  );
  const [checkDiscount, { isFetching: checkingCoupon }] =
    useLazyDiscountQuery();

  const incrementHandler = (cartItem: CartItem) => {
    if (cartItem.quantity >= cartItem.stock) return;

    dispatch(addToCart({ ...cartItem, quantity: cartItem.quantity + 1 }));
  };

  const decrementHandler = (cartItem: CartItem) => {
    if (cartItem.quantity <= 1) return;

    dispatch(addToCart({ ...cartItem, quantity: cartItem.quantity - 1 }));
  };

  const removeHandler = (productId: string) => {
    dispatch(removeCartItem(productId));
  };

  const applyCouponHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = couponCode.trim();

    if (!code) {
      dispatch(discountApplied(0));
      dispatch(saveCoupon(undefined));
      setCouponStatus(null);
    } else {
      try {
        const res = await checkDiscount(code).unwrap();
        dispatch(discountApplied(res.discount));
        dispatch(saveCoupon(code));
        setCouponStatus("valid");
      } catch {
        dispatch(discountApplied(0));
        dispatch(saveCoupon(undefined));
        setCouponStatus("invalid");
      }
    }
    dispatch(calculatePrice());
  };

  useEffect(() => {
    dispatch(calculatePrice());
  }, [cartItems, dispatch]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 50,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section className="bg-white antialiased py-16">
      <Breadcrumb pageName="Home" currentPage="Shopping Cart" />

      <motion.div
        className="mx-auto max-w-screen-xl px-4 2xl:px-0"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8">
          <motion.div
            className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl"
            variants={itemVariants}
          >
            <div className="space-y-6">
              {cartItems.length > 0 ? (
                cartItems.map((i, idx) => (
                  <CartItemCard
                    incrementHandler={incrementHandler}
                    decrementHandler={decrementHandler}
                    removeHandler={removeHandler}
                    key={idx}
                    cartItem={i}
                  />
                ))
              ) : (
                <h1 className="text-center text-gray-900">No Items Added</h1>
              )}
            </div>
          </motion.div>

          <motion.div
            className="mx-auto mt-6 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full"
            variants={itemVariants}
          >
            <motion.div
              className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
              variants={itemVariants}
            >
              <p className="text-xl font-semibold text-gray-900">
                Order summary
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <dl className="flex items-center justify-between gap-4">
                    <dt className="text-base font-normal text-gray-500">
                      Original price
                    </dt>
                    <dd className="text-base font-medium text-gray-900 ">
                      ₹{subtotal}
                    </dd>
                  </dl>

                  <dl className="flex items-center justify-between gap-4">
                    <dt className="text-base font-normal text-gray-500 ">
                      Tax:
                    </dt>
                    <dd className="text-base font-medium">₹{tax}</dd>
                  </dl>

                  <dl className="flex items-center justify-between gap-4">
                    <dt className="text-base font-normal text-gray-500 ">
                      Discount:
                    </dt>
                    <dd className="text-base font-medium text-green-600 ">
                      - ₹{discount}
                    </dd>
                  </dl>

                  <dl className="flex items-center justify-between gap-4">
                    <dt className="text-base font-normal text-gray-500">
                      Shipping Charges:
                    </dt>
                    <dd className="text-base font-medium text-gray-900 ">
                      ₹{shippingCharges}
                    </dd>
                  </dl>
                </div>

                <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                  <dt className="text-base font-bold text-gray-900 ">Total:</dt>
                  <dd className="text-base font-bold text-gray-900 ">
                    ₹{total}
                  </dd>
                </dl>
              </div>

              <motion.div
                className="flex items-center justify-center gap-2"
                variants={itemVariants}
              >
                <span className="text-sm font-normal text-gray-500"> or </span>
                <Link
                  to="/search"
                  title=""
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 underline hover:no-underline"
                >
                  Continue Shopping
                </Link>
              </motion.div>
              {cartItems.length > 0 && (
                <Button
                  asChild
                  className="w-full bg-green-150 text-white hover:bg-green-150/80"
                >
                  <Link to="/shipping">Proceed to Checkout</Link>
                </Button>
              )}
            </motion.div>

            <motion.div
              className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
              variants={itemVariants}
            >
              <div className="mb-2 text-sm font-medium text-gray-900 ">
                Do you have a coupon or gift card?
              </div>
              <form className="flex space-x-4" onSubmit={applyCouponHandler}>
                <div>
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponStatus(null);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                  />
                  {couponStatus === "valid" && (
                    <span className="text-green-600 text-sm">
                      ₹{discount} off using the <code>{coupon}</code>
                    </span>
                  )}
                  {couponStatus === "invalid" && (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      Invalid Coupon <VscError />
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={checkingCoupon}
                  className="bg-green-150 hover:bg-green-150/80"
                >
                  {checkingCoupon ? "Checking..." : "Apply Code"}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Cart;
