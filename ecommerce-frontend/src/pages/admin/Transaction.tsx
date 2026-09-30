import AdminSidebar from "../../components/Shared/admin/AdminSidebar";
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { ReactElement, useState, useEffect } from "react";
import TableHOC from "../../components/Shared/admin/TableHOC";
import { useAllOrdersQuery } from "@/redux/api/orderApi";
import { CustomError } from "@/types/api-types";
import toast from "react-hot-toast";
import { LineSkeleton } from "@/components/Shared/Loader";

interface DataType {
  user: string;
  amount: number;
  discount: number;
  quantity: number;
  status: ReactElement;
  action: ReactElement;
}

const columns: ColumnDef<DataType>[] = [
  {
    header: "Avatar",
    accessorKey: "user",
  },
  {
    header: "Amount",
    accessorKey: "amount",
  },
  {
    header: "Discount",
    accessorKey: "discount",
  },
  {
    header: "Quantity",
    accessorKey: "quantity",
  },
  {
    header: "Status",
    accessorKey: "status",
  },
  {
    header: "Action",
    accessorKey: "action",
  },
];

const Transaction = () => {

  const { isLoading, isError, error, data } = useAllOrdersQuery();
  const [rows, setRows] = useState<DataType[]>([]);

  useEffect(() => {
    if (isError) toast.error((error as CustomError).data?.message);
  }, [isError, error]);

  useEffect(() => {
    if (data)
      setRows(
        data.orders.map((i) => ({
          user: i.user?.name ?? "Deleted user",
          amount: i.total,
          discount: i.discount,
          quantity: i.orderItems.length,
          status: (
            <span
              className={
                i.status === "Processing"
                  ? "text-red-500"
                  : i.status === "Shipped"
                  ? "text-green-500"
                  : "text-purple-500"
              }
            >
              {i.status}
            </span>
          ),
          action: <Link to={`/admin/transaction/${i._id}`}>Manage</Link>,
        }))
      );
  }, [data]);

  const Table = TableHOC<DataType>(
    columns,
    rows,
    "dashboard-product-box",
    "Transactions",
    rows.length > 6
  )();

  return (
    <div className="h-screen xl:grid xl:grid-cols-6 bg-gray-50/50">
      <div>
        <AdminSidebar />
      </div>

      <div className="md:col-span-5 xl:col-span-5 flex flex-row overflow-y-auto m-4 p-4 bg-clip-border rounded-xl bg-white text-gray-700 shadow-md">
        <div className="w-full">
          {" "}
          {isLoading ? (
            <>
              <LineSkeleton />
            </>
          ) : (
            Table
          )}
        </div>
      </div>
    </div>
  );
};

export default Transaction;
