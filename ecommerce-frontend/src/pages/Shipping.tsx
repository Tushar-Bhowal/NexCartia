import React, { useState, ChangeEvent, useEffect, FormEvent } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Breadcrumb from "@/components/Shared/Breadcrumb";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { saveShippingInfo } from "@/redux/reducer/cartReducer";
import { useCreatePaymentMutation } from "@/redux/api/paymentApi";
import { CustomError } from "@/types/api-types";
import toast from "react-hot-toast";

const AddressForm: React.FC = () => {
  const {
    cartItems,
    coupon,
    shippingInfo: savedShippingInfo,
  } = useSelector((state: RootState) => state.cartReducer);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [createPayment, { isLoading }] = useCreatePaymentMutation();

  const [shippingInfo, setShippingInfo] = useState(savedShippingInfo);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    setShippingInfo((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(saveShippingInfo(shippingInfo));

    try {
      const data = await createPayment({
        items: cartItems.map(({ productId, quantity }) => ({
          productId,
          quantity,
        })),
        shippingInfo,
        coupon,
      }).unwrap();

      navigate("/payment", {
        state: data.clientSecret,
      });
    } catch (error) {
      const err = error as CustomError;
      toast.error(err.data?.message || "Something went wrong");
    }
  };

  useEffect(() => {
    if (cartItems.length <= 0) navigate("/cart");
  }, [cartItems, navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mt-12">
        <Breadcrumb pageName="cart" currentPage="Shipping" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="space-y-6 md:pr-8">
          <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>

          <form className="space-y-4 flex flex-col" onSubmit={submitHandler}>
            <div>
              <label className="block text-gray-700 mb-1">Address</label>
              <input
                required
                type="text"
                name="address"
                placeholder="Address"
                value={shippingInfo.address}
                onChange={handleInputChange}
                className="w-full rounded-lg border py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">City</label>
              <input
                required
                type="text"
                placeholder="City"
                name="city"
                value={shippingInfo.city}
                onChange={handleInputChange}
                className="w-full rounded-lg border py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">State</label>
              <input
                required
                type="text"
                placeholder="State"
                name="state"
                value={shippingInfo.state}
                onChange={handleInputChange}
                className="w-full rounded-md border p-2"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Country</label>
              <select
                name="country"
                required
                value={shippingInfo.country}
                onChange={handleInputChange}
                className="w-full rounded-md border p-2"
              >
                <option value="">Select Country</option>
                <option value="IN">India</option>
                <option value="US">USA</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">PIN Code</label>
              <input
                required
                type="text"
                inputMode="numeric"
                placeholder="Pin Code"
                name="pinCode"
                value={shippingInfo.pinCode}
                onChange={handleInputChange}
                className="w-full rounded-md border p-2"
              />
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2"
              >
                <CreditCard className="h-5 w-5" />
                {isLoading ? "Preparing payment..." : "Proceed to Payment"}
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AddressForm;
