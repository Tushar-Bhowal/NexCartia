import { useSubscribeMutation } from "@/redux/api/messageApi";
import { CustomError } from "@/types/api-types";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";

const NewsLetter = () => {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [subscribe, { isLoading }] = useSubscribeMutation();

  // Hidden on admin and the auth page (login is a self-contained, full-height screen).
  const isHidden =
    location.pathname.startsWith("/admin") ||
    location.pathname === "/login";

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await subscribe(email).unwrap();
      toast.success(res.message);
      setEmail("");
    } catch (error) {
      toast.error((error as CustomError).data?.message || "Could not subscribe");
    }
  };

  return (
    <>
      {!isHidden && (
        <section className="mt-20">
          <div className="bg-green-150 p-6 md:p-12 ">
            <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-white mb-4 md:mb-0">
                <h2 className="text-2xl md:text-4xl font-bold">
                  Sign up to our newsletter
                </h2>
                <p className="text-xl md:text-2xl">& get 20% off</p>
              </div>
              <form
                onSubmit={submitHandler}
                className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  aria-label="Email address"
                  className="flex-1 rounded px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-white text-black px-8 py-3 rounded hover:bg-gray-100 transition-colors disabled:opacity-60"
                >
                  {isLoading ? "SIGNING UP..." : "SIGN UP FOR FREE"}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default NewsLetter;
