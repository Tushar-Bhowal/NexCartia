import Breadcrumb from "@/components/Shared/Breadcrumb";
import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { resetCart } from "../redux/reducer/cartReducer";
import { CustomError } from "../types/api-types";
import { useNewOrderMutation } from "@/redux/api/orderApi";
import { productAPI } from "@/redux/api/productApi";
import { RootState } from "@/redux/store";

const stripeKey: string | undefined = import.meta.env.VITE_STRIPE_KEY;
// Without a publishable key Stripe.js can't load, so the page says so instead of a dead Pay button
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const CheckOutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { cartItems, coupon } = useSelector(
    (state: RootState) => state.cartReducer
  );

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [formReady, setFormReady] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  // Set once Stripe confirms the charge, so a failed order save can be retried without paying again
  const [paidIntentId, setPaidIntentId] = useState<string>();

  const [newOrder] = useNewOrderMutation();

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements || !formReady) {
      toast.error("The payment form is still loading, please wait a moment");
      return;
    }
    setIsProcessing(true);

    try {
      let paymentIntentId = paidIntentId;

      if (!paymentIntentId) {
        const { paymentIntent, error } = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: window.location.origin },
          redirect: "if_required",
        });

        if (error) {
          toast.error(error.message || "Something Went Wrong");
          return;
        }

        if (paymentIntent.status !== "succeeded") {
          toast.error(`Payment is ${paymentIntent.status}. Please try again.`);
          return;
        }

        paymentIntentId = paymentIntent.id;
        setPaidIntentId(paymentIntentId);
      }

      const res = await newOrder({
        paymentIntentId,
        items: cartItems.map(({ productId, size, quantity }) => ({
          productId,
          ...(size && { size }),
          quantity,
        })),
        coupon,
      }).unwrap();

      dispatch(resetCart());
      dispatch(productAPI.util.invalidateTags(["product"]));
      toast.success(res.message);
      navigate("/payment/success", { replace: true, state: res.order });
    } catch (error) {
      const message = (error as CustomError).data?.message;
      toast.error(
        message ||
          "Your payment went through but we couldn't save the order. Please press Retry."
      );
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="checkout-container">
      <form onSubmit={submitHandler}>
        <div className="space-y-4">
          <div className="text-xl font-semibold text-gray-900">Card Detail</div>
          <PaymentElement
            onReady={() => setFormReady(true)}
            onLoadError={(e) => setLoadError(e.error.message)}
          />
          {!formReady && !loadError && (
            <p className="text-sm text-gray-500" aria-live="polite">
              Loading secure card form…
            </p>
          )}
          {loadError && (
            <p role="alert" className="text-sm text-red-600">
              The card form couldn't load: {loadError}
            </p>
          )}
        </div>
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full p-4 mt-4 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-500/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isProcessing || !stripe || !formReady}
        >
          {isProcessing
            ? "Processing..."
            : paidIntentId
            ? "Retry placing order"
            : "Pay"}
        </motion.button>
      </form>
    </div>
  );
};

const Payment = () => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.userReducer);

  const { shippingInfo, subtotal, tax, total, shippingCharges, discount } =
    useSelector((state: RootState) => state.cartReducer);

  const clientSecret: string | undefined = location.state;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 50 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    }
  };

  if (!clientSecret) return <Navigate to={"/shipping"} />;

  if (!stripePromise)
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 pt-16 text-center">
        <p className="text-xl font-semibold text-gray-900">Card payments aren't available right now</p>
        <p className="max-w-md text-sm text-gray-500">
          The store's payment setup is incomplete. Your bag is saved, so please try again later.
        </p>
        <Link to="/cart" className="mt-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white">
          Back to bag
        </Link>
      </div>
    );
  return (
    <Elements
      options={{
        clientSecret,
      }}
      stripe={stripePromise}
    >
      <div className="mt-12">
        <Breadcrumb pageName="shipping" currentPage="Payment" />
      </div>

      <motion.div 
        className="flex flex-col md:flex-row max-w-7xl mx-auto w-full justify-center items-center md:items-baseline border-t-2"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="p-6 space-y-6 md:border-r-2 sm:w-2/3"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            Pay securely with any credit or debit card
          </div>
          <CheckOutForm />
        </motion.div>

        <motion.div 
          className="rounded-lg flex flex-col md:w-1/3 border-2 sm:w-1/2 md:border-0"
          variants={itemVariants}
        >
          <motion.div 
            className="flex flex-col border-b-2 h-1/3 p-6"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Shipping To
            </h2>
            <h3 className="font-sora-medium text-md">{user?.name}</h3>
            <p className="text-gray-500 text-sm">
              {shippingInfo.address},{shippingInfo.pinCode}
            </p>
          </motion.div>
          <motion.div 
            className="h-1/2 p-6"
            variants={itemVariants}
          >
            <p className="text-xl font-semibold text-gray-900 mb-3">
              Order summary
            </p>

            <div className="space-y-6">
              <div className="space-y-4">
                <dl className="flex items-center justify-between gap-4">
                  <dt className="text-base font-normal text-gray-500">
                    Original price
                  </dt>
                  <dd className="text-base font-medium text-gray-900 ">
                    ₹{subtotal}
                  </dd>
                </dl>

                <dl className="flex items-center justify-between gap-4">
                  <dt className="text-base font-normal text-gray-500 ">Tax:</dt>
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

              <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <dt className="text-base font-bold text-gray-900 ">Total:</dt>
                <dd className="text-base font-bold text-gray-900 ">₹{total}</dd>
              </dl>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </Elements>
  );
};

export default Payment;