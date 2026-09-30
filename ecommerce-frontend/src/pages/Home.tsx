import ProductCard from "@/components/Shared/ProductCard";
import { Link } from "react-router-dom";
import video from "../assets/branding.mp4";
import { WobbleCard } from "@/components/Shared/WobbleCard";
import { Button } from "@/components/ui/button";
import { useLatestProductsQuery } from "@/redux/api/productApi";
import toast from "react-hot-toast";
import { ProductSkeleton } from "@/components/Shared/Loader";
import { CartItem } from "@/types/types";
import { addToCart } from "@/redux/reducer/cartReducer";
import { useDispatch } from "react-redux";
import { useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const promises = [
  "Free Shipping Worldwide",
  "30-Day Easy Returns",
  "Secure Checkout",
  "New Drops Every Week",
  "Curated For You",
];

const Home = () => {
  const { data, isError, isLoading } = useLatestProductsQuery();

  const dispatch = useDispatch();

  const addToCartHandler = (cartItem: CartItem) => {
    if (cartItem.stock < 1) return toast.error("Out of Stock");

    dispatch(addToCart(cartItem));
    toast.success("Added to cart");
  };

  useEffect(() => {
    if (isError) toast.error("Cannot Fetch the Products");
  }, [isError]);

  // Parallax for the Lookbook: each image drifts at a different rate as the
  // section scrolls through the viewport. Disabled when the user prefers reduced motion.
  const lookbookRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: lookbookRef,
    offset: ["start end", "end start"],
  });
  const yFeature = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [50, -50]
  );
  const ySmallA = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [-40, 40]
  );
  const ySmallB = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [40, -40]
  );

  return (
    <div>
      <section className="relative w-full h-screen overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source src={video} type="video/mp4" />
        </video>
      </section>

      <section className="mt-10 p-5">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-black-heading uppercase text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sora-bold">
            Elevating Your Style Game
          </h1>
          <p className="text-gray-500 text-center text-xs sm:text-md md:text-lg md:w-1/2">
            Discover the Perfect Blend of Comfort and Trend with Our Exclusive
            Collection. Explore Deals on Jeans, Sneakers, and More!
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full">
            <WobbleCard
              containerClassName="col-span-1 lg:col-span-2 h-full bg-pink-800 min-h-125 lg:min-h-[300px]"
              navigateTo="/category/jeans"
            >
              <div className="max-w-xs">
                <h2 className="text-left uppercase text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                  Jeans
                </h2>
                <p className="mt-4 text-left  text-base/6 text-neutral-200">
                  Style and comfort meet in our collection of jeans. Discover
                  the latest trends and perfect cuts for an impeccable look.
                </p>
              </div>
              <img
                src="/jeans.png"
                alt="jeans image"
                className="absolute w-1/2 h-full -right-4 lg:right-[-10%] grayscale filter  md:-bottom-2 object-contain rounded-2xl"
              />
            </WobbleCard>

            <WobbleCard
              containerClassName="col-span-1 min-h-[300px]"
              navigateTo="/category/t-shirt"
            >
              <div className="max-w-xs">
                <h2 className="text-left uppercase text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                  T-Shirts
                </h2>
                <p className="mt-2 max-w-104 text-left text-base/6 text-neutral-200">
                  Experience casual comfort and effortless style with our
                  versatile t-shirt collection.
                </p>
              </div>
              <img
                src="/tshirt.avif"
                alt="t-shirt"
                className="absolute w-1/2 h-full -right-4 lg:right-[22%] grayscale filter -bottom-28 md:-bottom-28 object-contain rounded-2xl"
              />
            </WobbleCard>

            <WobbleCard
              containerClassName="col-span-1 min-h-[300px]"
              navigateTo="/category/shirts"
            >
              <div className="max-w-xs">
                <h2 className="text-left uppercase text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                  Shirts
                </h2>
                <p className="mt-2 max-w-104 text-left text-base/6 text-neutral-200">
                  Discover refined style and unmatched comfort with our latest
                  shirt collection.
                </p>
              </div>
              <img
                src="/shirts.avif"
                alt="shirt"
                className="absolute w-1/2 h-full -right-4 lg:right-[22%] grayscale filter -bottom-28 md:-bottom-28 object-contain rounded-2xl"
              />
            </WobbleCard>

            <WobbleCard
              containerClassName="col-span-1 lg:col-span-2 bg-green-700 min-h-125 lg:min-h-[600px] xl:min-h-[300px]"
              navigateTo="/category/footwears"
            >
              <div className="max-w-sm">
                <h2 className="max-w-sm md:max-w-lg  text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                  Footwears
                </h2>
                <p className="mt-4 max-w-104 text-left  text-base/6 text-neutral-200">
                  Step into style and comfort with our trendy footwear
                  collection, perfect for any occasion.
                </p>
              </div>
              <img
                src="/footwears.png"
                width={400}
                height={400}
                alt="footwear"
                className="absolute -right-10 md:right-0 -bottom-10 object-contain rounded-2xl"
              />
            </WobbleCard>
          </div>
        </div>
      </section>

      <section className="mt-16 bg-black-150 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-stretch min-h-125">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center p-10 lg:p-16 lg:w-1/2"
          >
            <span className="text-green-150 text-xs uppercase tracking-widest font-sora-semibold mb-4">
              Who We Are
            </span>
            <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-sora-bold leading-tight mb-6">
              Built for how<br />you live.
            </h2>
            <p className="text-neutral-400 text-base lg:text-lg leading-relaxed mb-8 max-w-md">
              NexCartia brings you carefully curated pieces that move with you,
              from the morning commute to late-night plans. No compromise on
              quality, no compromise on style.
            </p>
            <Link to="/search">
              <Button className="bg-green-150 hover:bg-green-150/90 w-fit px-8 uppercase tracking-widest text-sm">
                Explore the store
              </Button>
            </Link>
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="lg:w-1/2 flex h-100 lg:h-auto lg:self-stretch"
          >
            <div className="w-1/2">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
                alt="Fashion editorial"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-1/2 flex flex-col">
              <div className="flex-1 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
                  alt="Fashion collection"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80"
                  alt="Street style"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mt-16 p-5">
        <div className="flex flex-col items-center mb-16">
          <h1 className="text-black-heading uppercase text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sora-bold">
            TRENDING NOW
          </h1>
        </div>
        <div className="max-w-7xl mx-auto w-full">
          <div className="mt-6 flex gap-6 flex-wrap">
            {isLoading ? (
              <ProductSkeleton />
            ) : (
              data?.products.map((i) => (
                <ProductCard
                  key={i._id}
                  productId={i._id}
                  name={i.name}
                  price={i.price}
                  stock={i.stock}
                  handler={addToCartHandler}
                  photos={i.photos}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-16 p-5">
        <div ref={lookbookRef} className="max-w-7xl mx-auto w-full">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2"
          >
            <div className="max-w-xl">
              <span className="text-green-150 text-xs uppercase tracking-widest font-sora-semibold">
                The Lookbook
              </span>
              <h2 className="text-black-heading text-3xl sm:text-4xl lg:text-5xl font-sora-bold mt-1">
                Pieces that tell your story.
              </h2>
            </div>
            <Link
              to="/search"
              className="text-sm text-black-text underline underline-offset-4 hover:text-black-full shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-150 focus-visible:ring-offset-2 rounded-sm"
            >
              View all
            </Link>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 relative overflow-hidden rounded-2xl h-87.5 md:h-150">
              <motion.img
                style={{ y: yFeature }}
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80"
                alt="Editorial look"
                className="absolute inset-x-0 top-[-15%] w-full h-[130%] object-cover"
              />
            </div>
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="relative overflow-hidden rounded-2xl h-72.5 md:h-73">
                <motion.img
                  style={{ y: ySmallA }}
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"
                  alt="Styled outfit detail"
                  className="absolute inset-x-0 top-[-15%] w-full h-[130%] object-cover"
                />
              </div>
              <div className="relative overflow-hidden rounded-2xl h-72.5 md:h-73">
                <motion.img
                  style={{ y: ySmallB }}
                  src="https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=900&q=80"
                  alt="Wardrobe selection"
                  className="absolute inset-x-0 top-[-15%] w-full h-[130%] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mt-16 bg-black-150 py-6 overflow-hidden"
        aria-label="Why shop with NexCartia"
      >
        <motion.div
          className="flex w-max items-center"
          animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 24, ease: "linear", repeat: Infinity }
          }
        >
          {[...promises, ...promises].map((text, idx) => (
            <span
              key={idx}
              aria-hidden={idx >= promises.length}
              className="flex items-center gap-10 pr-10 text-white uppercase tracking-widest font-sora-semibold text-sm"
            >
              {text}
              <span className="text-green-150">✦</span>
            </span>
          ))}
        </motion.div>
      </section>

      <section className="mt-16 p-5">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex max-w-7xl mx-auto w-full flex-col sm:flex-row justify-between sm:items-end mb-10 gap-4"
        >
          <div>
            <span className="text-green-150 text-xs uppercase tracking-widest font-sora-semibold">
              Find Your Fit
            </span>
            <h1 className="text-black-heading uppercase text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sora-bold mt-1">
              Shop now
            </h1>
          </div>
          <Link to="/search">
            <Button className="bg-green-150 hover:bg-green-150/90 sm:h-12 sm:w-44 text-md md:text-2xl uppercase">
              Shop
            </Button>
          </Link>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto w-full">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="h-100 md:h-150"
          >
            <Link
              to="/gender/female"
              className="block relative overflow-hidden rounded-2xl w-full h-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-150 focus-visible:ring-offset-2"
            >
              <img
                src="https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=1200&q=80"
                alt="Women's collection"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-8 left-8 z-10">
                <span className="text-neutral-300 text-xs uppercase tracking-widest font-sora-semibold">
                  For Her
                </span>
                <h3 className="text-white text-2xl lg:text-3xl font-sora-bold mt-1">
                  Women's Collection
                </h3>
                <span className="inline-block mt-3 text-white text-sm underline underline-offset-4">
                  Shop now
                </span>
              </div>
            </Link>
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="h-100 md:h-150"
          >
            <Link
              to="/gender/male"
              className="block relative overflow-hidden rounded-2xl w-full h-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-150 focus-visible:ring-offset-2"
            >
              <img
                src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1200&q=80"
                alt="Men's collection"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-8 left-8 z-10">
                <span className="text-neutral-300 text-xs uppercase tracking-widest font-sora-semibold">
                  For Him
                </span>
                <h3 className="text-white text-2xl lg:text-3xl font-sora-bold mt-1">
                  Men's Collection
                </h3>
                <span className="inline-block mt-3 text-white text-sm underline underline-offset-4">
                  Shop now
                </span>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mt-16 -mb-20 relative overflow-hidden min-h-125 flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=2000&q=80"
          alt="Fashion banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/70" />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative z-10 text-center text-white px-5 max-w-2xl mx-auto"
        >
          <span className="text-green-150 text-xs uppercase tracking-widest font-sora-semibold">
            New Season
          </span>
          <h2 className="text-white text-4xl sm:text-5xl lg:text-6xl font-sora-bold mt-4 mb-6 leading-tight">
            Style That Speaks<br />for Itself.
          </h2>
          <p className="text-neutral-300 text-base lg:text-lg mb-8 max-w-md mx-auto">
            From essentials to statement pieces, your next favorite look is one
            click away.
          </p>
          <Link to="/search">
            <Button className="bg-green-150 hover:bg-green-150/90 px-10 py-6 text-sm uppercase tracking-widest">
              Shop the Collection
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
