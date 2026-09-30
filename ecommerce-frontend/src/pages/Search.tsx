import Breadcrumb from "@/components/Shared/Breadcrumb";
import { ProductSkeleton } from "@/components/Shared/Loader";
import ProductCard from "@/components/Shared/ProductCard";
import {
  useCategoriesQuery,
  useSearchProductsQuery,
} from "@/redux/api/productApi";
import { addToCart } from "@/redux/reducer/cartReducer";
import { CustomError } from "@/types/api-types";
import { CartItem } from "@/types/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BiSearch } from "react-icons/bi";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";

const Search = () => {
  const {
    data: categoriesResponse,
    isLoading: loadingCategories,
    isError,
    error,
  } = useCategoriesQuery();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const categories = ["ALL", ...(categoriesResponse?.categories || [])];

  const {
    isLoading: productLoading,
    data: searchedData,
    isError: productIsError,
    error: productError,
  } = useSearchProductsQuery({
    search,
    sort,
    category,
    page,
    price: maxPrice,
  });

  const dispatch = useDispatch();

  const addToCartHandler = (cartItem: CartItem) => {
    if (cartItem.stock < 1) return toast.error("Out of Stock");

    dispatch(addToCart(cartItem));
    toast.success("Added to cart");
  };
  const totalPage = searchedData?.totalPage;
  const isPrevPage = page > 1;
  const isNextPage = page < (totalPage ?? 1);

  useEffect(() => {
    if (isError) toast.error((error as CustomError).data?.message);
  }, [isError, error]);

  useEffect(() => {
    if (productIsError) toast.error((productError as CustomError).data?.message);
  }, [productIsError, productError]);

  return (
    <div>
      <div className="mt-12">
        <Breadcrumb pageName="Home" currentPage="Products" />
      </div>
      <div className="flex gap-8 p-8">
        <aside
          className={`
          fixed top-0 left-0 z-50 min-w-[20rem] h-screen p-8 shadow-md 
          bg-white transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "" : "-translate-x-full"}
          md:static md:translate-x-0 md:flex md:flex-col md:justify-start md:gap-10
        `}
        >
          <div className="flex justify-between items-center mb-6 md:hidden">
            <h2 className="text-3xl font-semibold">Filters</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-xl font-bold"
            >
              ×
            </button>
          </div>
          <h2 className="text-3xl font-semibold hidden md:flex">Filters</h2>
          <div>
            <h4 className="text-lg font-semibold mb-2">Sort</h4>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="px-4 w-full border-2 py-2 rounded-md text-sm outline-none"
            >
              <option value="">None</option>
              <option value="asc">Price (Low to High)</option>
              <option value="dsc">Price (High to Low)</option>
            </select>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2">
              Max Price: {maxPrice || ""}
            </h4>
            <input
              type="range"
              min={100}
              max={100000}
              value={maxPrice}
              className="w-full"
              onChange={(e) => {
                setMaxPrice(Number(e.target.value));
                setPage(1);
              }}
            />
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2">Category</h4>
            <div className="space-y-2">
              {loadingCategories ? (
                <div className="animate-pulse">
                  {[1, 2, 3, 4].map((_, index) => (
                    <div
                      key={index}
                      className="w-full h-10 bg-gray-200 rounded-md mb-2"
                    ></div>
                  ))}
                </div>
              ) : (
                categories.map((cat) => (
                  <motion.button
                    key={cat}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setCategory(cat === "ALL" ? "" : cat);
                      setPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                      category === cat || (cat === "ALL" && category === "")
                        ? "bg-green-50 text-green-500 font-medium"
                        : "text-gray-600 hover:bg-green-50"
                    }`}
                  >
                    {cat.toUpperCase()}
                  </motion.button>
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="w-full">
          <div className="flex w-full mb-5 rounded bg-white">
            <input
              className="w-full border-none bg-gray-100 rounded-xl px-4 py-1 text-gray-400 outline-none focus:outline-none"
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <button
              type="button"
              className="m-2 rounded-full bg-green-400 p-2 md:p-4 text-white"
            >
              <BiSearch className="fill-current h-6 w-6" />{" "}
              {/* Using the BiSearch icon */}
            </button>
            <button
              type="button"
              className="m-2 md:hidden rounded-full bg-green-400 p-2 text-white"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <SlidersHorizontal />
            </button>
          </div>
          {productLoading ? (
            <ProductSkeleton />
          ) : (
            <div className="flex gap-6 flex-wrap overflow-y-auto">
              {searchedData?.products.map((i) => (
                <ProductCard
                  key={i._id}
                  productId={i._id}
                  name={i.name}
                  price={i.price}
                  stock={i.stock}
                  handler={addToCartHandler}
                  photos={i.photos}
                />
              ))}
            </div>
          )}
          {searchedData && searchedData.totalPage > 1 && (
            <article className="flex mt-4 justify-center items-center gap-4">
              <button
                className="px-4 py-2 rounded-md bg-green-150 text-white hover:bg-green-150/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isPrevPage}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Prev
              </button>
              <span>
                {page} of {searchedData.totalPage}
              </span>
              <button
                className="px-4 py-2 rounded-md bg-green-150 text-white hover:bg-green-150/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isNextPage}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </article>
          )}
        </main>
      </div>
    </div>
  );
};

export default Search;
