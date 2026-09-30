import Breadcrumb from "@/components/Shared/Breadcrumb";
import { LineSkeleton } from "@/components/Shared/Loader";
import { StarRating } from "@/components/Shared/StarRating";
import { useOrderDetailsQuery } from "@/redux/api/orderApi";
import { Link, useParams } from "react-router-dom";

const statusColor: Record<string, string> = {
  Processing: "text-red-500",
  Shipped: "text-green-500",
  Delivered: "text-purple-500",
};

const OrderDetails = () => {
  const { id } = useParams();
  // Refetch on every visit so a review left on the product page shows up here
  const { data, isLoading, isError } = useOrderDetailsQuery(id!, {
    refetchOnMountOrArgChange: true,
  });

  if (isLoading)
    return (
      <div className="container mx-auto max-w-5xl px-4 pt-28">
        <LineSkeleton />
      </div>
    );

  if (isError || !data)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 pt-16">
        <p className="text-lg text-gray-700">This order could not be found.</p>
        <Link to="/orders" className="text-green-150 underline">
          Back to my orders
        </Link>
      </div>
    );

  const { order, myRatings } = data;
  const delivered = order.status === "Delivered";
  const { address, city, state, country, pinCode } = order.shippingInfo;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mt-12">
        <Breadcrumb pageName="My Orders" currentPage="Order Details" />
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="break-all text-2xl font-bold text-gray-900">Order #{order._id}</h1>
        <p className="text-sm text-gray-500">
          Placed on {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <section className="space-y-4 md:col-span-2">
          {order.orderItems.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
            >
              <img
                src={item.photo}
                alt={item.name}
                className="h-16 w-16 rounded-md object-cover"
              />
              <div className="flex-1">
                <Link
                  to={`/product/${item.productId}`}
                  className="block font-medium text-gray-900 hover:underline"
                >
                  {item.name}
                  {item.size && (
                    <span className="block text-sm font-normal text-gray-500">
                      Size: {item.size}
                    </span>
                  )}
                </Link>
                {!delivered ? (
                  <p className="mt-1 text-xs text-gray-500">
                    You can rate this item once it's delivered.
                  </p>
                ) : myRatings?.[item.productId] ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <StarRating value={myRatings[item.productId]} />
                    <Link
                      to={`/product/${item.productId}#reviews`}
                      className="text-gray-600 underline underline-offset-2 hover:text-gray-900"
                    >
                      Edit your review
                    </Link>
                  </div>
                ) : (
                  <Link
                    to={`/product/${item.productId}#reviews`}
                    className="mt-2 inline-block rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white hover:bg-stone-800"
                  >
                    Rate this item
                  </Link>
                )}
              </div>
              <span className="text-sm text-gray-700">
                ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
              </span>
            </div>
          ))}
        </section>

        <aside className="space-y-6 rounded-lg border border-gray-200 p-6">
          <div>
            <h2 className="font-semibold text-gray-900">Status</h2>
            <p className={statusColor[order.status] ?? "text-gray-700"}>
              {order.status}
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">Shipping to</h2>
            <p className="text-sm text-gray-600">
              {address}, {city}, {state}, {country} {pinCode}
            </p>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd>₹{order.subtotal}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Tax</dt>
              <dd>₹{order.tax}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Shipping</dt>
              <dd>₹{order.shippingCharges}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Discount</dt>
              <dd className="text-green-600">- ₹{order.discount}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
              <dt>Total</dt>
              <dd>₹{order.total}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
};

export default OrderDetails;
