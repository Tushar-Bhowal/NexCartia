
import AdminSidebar from "../../../components/Shared/admin/AdminSidebar";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDeleteOrderMutation,
  useOrderDetailsQuery,
  useUpdateOrderMutation,
} from "@/redux/api/orderApi";
import { responseToast } from "@/utils/Features";
import { Order, OrderItem } from "@/types/types";

const defaultData: Order = {
  shippingInfo: {
    address: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
  },
  status: "",
  subtotal: 0,
  discount: 0,
  shippingCharges: 0,
  tax: 0,
  total: 0,
  orderItems: [],
  user: { name: "", _id: "" },
  createdAt: "",
  _id: "",
};

const TransactionManagement = () => {

  const params = useParams();
  const navigate = useNavigate();

  const { data, isError } = useOrderDetailsQuery(params.id!);
  const {
    shippingInfo: { address, city, state, country, pinCode },
    orderItems,
    user,
    status,
    tax,
    subtotal,
    total,
    discount,
    shippingCharges,
  } = data?.order || defaultData;
  

  const [updateOrder] = useUpdateOrderMutation();
  const [deleteOrder] = useDeleteOrderMutation();
  const orderid = data?.order._id;

  const updateHandler = async () => {
    if (!orderid) return;
    const res = await updateOrder(orderid);
    responseToast(res, navigate, "/admin/transaction");
  };

  const deleteHandler = async () => {
    if (!orderid) return;
    const res = await deleteOrder(orderid);
    responseToast(res, navigate, "/admin/transaction");
  };

  if (isError) return <Navigate to={"/404"} />;
  return (
    <div className="admin-container h-screen flex bg-gray-50/50">
      <div className="lg:w-64 flex-shrink-0">
        <AdminSidebar />
      </div>
      <main className="product-management flex-1 min-w-0 gap-4 flex flex-col sm:flex-row justify-center items-center p-4 overflow-y-auto">
        <section
          style={{ height: "85vh" }}
          className="w-full max-w-md p-10 flex flex-col relative rounded-xl bg-white text-gray-700 shadow-md  overflow-y-auto"
        >
          <h2 className="antialiased uppercase tracking-normal text-2xl font-semibold leading-snug text-center mb-5">
            Order Items
          </h2>

          {orderItems.map((item) => (
            <ProductCard
              key={item._id} 
              name={item.name}
              photo={item.photo}
              productId={item.productId}
              size={item.size}
              quantity={item.quantity}
              price={item.price}
            />
          ))}
        </section>

        <article
          style={{ height: "85vh" }}
          className="shipping-info-card w-full max-w-sm p-8 flex flex-col relative rounded-xl bg-white text-gray-700 shadow-md"
        >
          <Button
            className="bg-black-text hover:bg-black-text/90 w-1/6"
            onClick={deleteHandler}
          >
            <Trash className="w-6 h-6 text-white " />
          </Button>
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="antialiased tracking-normal text-2xl font-semibold leading-snug text-center uppercase mb-5">
                Order Info
              </h1>
              <h5 className="font-bold">User Info</h5>
              <p>Name: {user?.name ?? "Deleted user"}</p>
              <p>
                Address:{" "}
                {`${address}, ${city}, ${state}, ${country} ${pinCode}`}
              </p>
            </div>
            <div>
              <h5 className="font-bold">Amount Info</h5>
              <p>Subtotal: ₹{subtotal}</p>
              <p>Shipping Charges: ₹{shippingCharges}</p>
              <p>Tax: ₹{tax}</p>
              <p>Discount: ₹{discount}</p>
              <p>Total: ₹{total}</p>
            </div>
            <div>
              <h5 className="font-bold">Status Info</h5>
              <p>
                Status:{" "}
                <span
                  className={
                    status === "Delivered"
                      ? "text-indigo-600"
                      : status === "Shipped"
                      ? "text-green-500"
                      : "text-red-600"
                  }
                >
                  {status}
                </span>
              </p>
            </div>
            <div>
              <Button
                variant="destructive"
                onClick={updateHandler}
                className="w-full"
              >
                Update
              </Button>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
};

const ProductCard = ({
  name,
  photo,
  price,
  quantity,
  productId,
  size,
}: Omit<OrderItem, "_id">) => (
  <div className="w-full transaction-product-card flex flex-row items-center justify-center p-1 gap-5">
    <img className="w-14 h-14 rounded-lg" src={photo} alt={name} />
    <div className="flex gap-12 ">
      <Link to={`/product/${productId}`}>
        {name}
        {size && <span className="text-gray-500"> ({size})</span>}
      </Link>
      <span>
        ₹{price} X {quantity} = ₹{price * quantity}
      </span>
    </div>
  </div>
);

export default TransactionManagement;
