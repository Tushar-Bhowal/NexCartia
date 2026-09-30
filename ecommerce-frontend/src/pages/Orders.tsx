import { ReactElement, useEffect, useState } from "react";

import { Link } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import TableHOC from "../components/Shared/admin/TableHOC";
import Breadcrumb from "@/components/Shared/Breadcrumb";
import { useMyOrdersQuery } from "@/redux/api/orderApi";
import { CustomError } from "@/types/api-types";
import toast from "react-hot-toast";
import { LineSkeleton } from "@/components/Shared/Loader";

type DataType = {
  _id: string;
  amount: number;
  quantity: number;
  discount: number;
  status: ReactElement;
  action: ReactElement;
};

const column: ColumnDef<DataType>[] = [
  {
    header: "ID",
    accessorKey: "_id",
  },
  {
    header: "Quantity",
    accessorKey: "quantity",
  },
  {
    header: "Discount",
    accessorKey: "discount",
  },
  {
    header: "Amount",
    accessorKey: "amount",
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

const Orders = () => {
  const { isLoading, data, isError, error } = useMyOrdersQuery();

  const [rows, setRows] = useState<DataType[]>([]);

  useEffect(() => {
    if (isError) toast.error((error as CustomError).data?.message);
  }, [isError, error]);

  useEffect(() => {
    if (data)
      setRows(
        data.orders.map((i) => ({
          _id: i._id,
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
          action: (
            <span className="flex gap-3">
              <Link to={`/order/${i._id}`}>View</Link>
              {i.status === "Delivered" && (
                <Link to={`/order/${i._id}`} className="font-semibold text-amber-600">
                  Rate items
                </Link>
              )}
            </span>
          ),
        }))
      );
  }, [data]);

  const Table = TableHOC<DataType>(
    column,
    rows,
    "dashboard-product-box",
    "Orders",
    rows.length > 6
  )();
  return (
    <div className="container max-w-7xl w-full overflow-auto">
      <div className="mt-12">
        <Breadcrumb pageName="Home" currentPage="My Orders" />
      </div>{" "}
      {isLoading ? (
        <>
          <LineSkeleton />
        </>
      ) : (
        Table
      )}
    </div>
  );
};

export default Orders;
