import Breadcrumb from "@/components/Shared/Breadcrumb";
import { ProductSkeleton } from "@/components/Shared/Loader";
import ProductCard from "@/components/Shared/ProductCard";
import { useProductsFilterQuery } from "@/redux/api/productApi";
import { addToCart } from "@/redux/reducer/cartReducer";
import { CartItem } from "@/types/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useLocation, useParams } from "react-router-dom";

const CategoryProducts = () => {

  const location = useLocation();
  const { category, gender } = useParams();
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();

  // Determine the type of collection (category or gender)
  const isCategory = location.pathname.includes('/category/');
  const collectionName = category || gender || '';

  const { data, isLoading, isError } = useProductsFilterQuery({
    page,
    gender: isCategory ? '' : collectionName,
    category: isCategory ? collectionName : ''
  });
    


  const addToCartHandler = (cartItem: CartItem) => {
    if (cartItem.stock < 1) return toast.error("Out of Stock");

    dispatch(addToCart(cartItem));
    toast.success("Added to cart");
  };

  useEffect(() => {
    setPage(1);
  }, [collectionName]);

  const isPrevPage = page > 1;
  const isNextPage = page < (data?.totalPage ?? 1);

  if (isError) return <div>Error fetching products</div>;

  return (
    <div>
      <div className="mt-12">
        <Breadcrumb pageName="Home" currentPage={collectionName} />
      </div>
      <div className="flex gap-8 p-8">
        <main className="w-full">
          {isLoading ? (
            <ProductSkeleton />
          ) : (
            <div className="flex  gap-6 flex-wrap">
              {data?.products.map((i) => (
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
          {data && data.totalPage > 1 && (
            <article className="flex justify-center items-center gap-4">
              <button
                className="px-4 py-2 rounded-md bg-green-150 text-white hover:bg-green-150/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isPrevPage}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Prev
              </button>
              <span>{page} of 4</span>
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

export default CategoryProducts;
