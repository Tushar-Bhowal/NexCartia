import { FormEvent, useEffect, useState } from "react";
import AdminSidebar from "@/components/Shared/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import {
  useAllCouponsQuery,
  useDeleteCouponMutation,
  useNewCouponMutation,
} from "@/redux/api/paymentApi";
import { responseToast } from "@/utils/Features";
import { FaTrash } from "react-icons/fa";

const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const allNumbers = "1234567890";
const allSymbols = "!@#$%^&*()_+";

const Coupon = () => {
  const [size, setSize] = useState<number>(8);
  const [prefix, setPrefix] = useState<string>("");
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(false);
  const [includeCharacters, setIncludeCharacters] = useState<boolean>(false);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const [coupon, setCoupon] = useState<string>("");
  const [amount, setAmount] = useState<number>(100);

  const { data: couponsData, isLoading: couponsLoading } = useAllCouponsQuery();
  const [newCoupon, { isLoading: saving }] = useNewCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();

  const saveHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await newCoupon({ coupon: coupon.trim(), amount });
    responseToast(res, null, "");
    if ("data" in res) setCoupon("");
  };

  const copyText = async (coupon: string) => {
    await window.navigator.clipboard.writeText(coupon);
    setIsCopied(true);
  };

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!includeNumbers && !includeCharacters && !includeSymbols)
      return alert("Please Select One At Least");

    let result: string = prefix || "";
    const loopLength: number = size - result.length;

    for (let i = 0; i < loopLength; i++) {
      let entireString: string = "";
      if (includeCharacters) entireString += allLetters;
      if (includeNumbers) entireString += allNumbers;
      if (includeSymbols) entireString += allSymbols;

      const randomNum: number = ~~(Math.random() * entireString.length);
      result += entireString[randomNum];
    }

    setCoupon(result);
  };

  useEffect(() => {
    setIsCopied(false);
  }, [coupon]);

  return (
    <div className="admin-container h-screen flex bg-gray-50/50">
      <div className="lg:w-64 flex-shrink-0">
        <AdminSidebar />
      </div>
      <main className="dashboard-app-container h-screen flex-1 min-w-0 g-clip-border rounded-xl bg-white shadow-md p-5 overflow-y-auto">
        <h1 className="text-md md:text-3xl font-bold mt-10 ml-8">Coupon</h1>
        <section className="flex flex-col justify-center items-center gap-2 py-8">
          <form className="coupon-form" onSubmit={submitHandler}>
            <input
              type="text"
              placeholder="Text to include"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              maxLength={size}
            />

            <input
              type="number"
              placeholder="Coupon Length"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              min={8}
              max={25}
            />

            <fieldset>
              <legend>Include</legend>

              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={() => setIncludeNumbers((prev) => !prev)}
              />
              <span>Numbers</span>

              <input
                type="checkbox"
                checked={includeCharacters}
                onChange={() => setIncludeCharacters((prev) => !prev)}
              />
              <span>Characters</span>

              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={() => setIncludeSymbols((prev) => !prev)}
              />
              <span>Symbols</span>
            </fieldset>
            <Button variant="destructive">Generate</Button>
          </form>

          {coupon && (
            <div className="coupon-container">
              <code className="coupon-code">
                {coupon}{" "}
                <button type="button" onClick={() => copyText(coupon)}>
                  {isCopied ? "Copied" : "Copy"}
                </button>{" "}
              </code>
            </div>
          )}

          <form
            onSubmit={saveHandler}
            className="mt-6 flex w-full max-w-md flex-col gap-3"
          >
            <h2 className="text-lg font-semibold">Save coupon</h2>
            <input
              type="text"
              required
              placeholder="Coupon code (generate one or type your own)"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="rounded-md border border-gray-300 p-2"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              Discount (₹)
              <input
                type="number"
                required
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex-1 rounded-md border border-gray-300 p-2"
              />
            </label>
            <Button disabled={saving}>{saving ? "Saving..." : "Save Coupon"}</Button>
          </form>

          <div className="mt-8 w-full max-w-md">
            <h2 className="mb-3 text-lg font-semibold">Active coupons</h2>
            {couponsLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : couponsData?.coupons.length ? (
              <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                {couponsData.coupons.map((c) => (
                  <li
                    key={c._id}
                    className="flex items-center justify-between gap-4 p-3"
                  >
                    <code className="break-all">{c.code}</code>
                    <span className="text-sm text-gray-700">₹{c.amount} off</span>
                    <button
                      type="button"
                      aria-label={`Delete coupon ${c.code}`}
                      onClick={async () =>
                        responseToast(await deleteCoupon(c._id), null, "")
                      }
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No coupons yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Coupon;
