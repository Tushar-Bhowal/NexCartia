import AdminSidebar from "../../components/Shared/admin/AdminSidebar";

import { ReactElement, useEffect, useState } from "react";

import TableHOC from "../../components/Shared/admin/TableHOC";
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { useAllProductsQuery } from "@/redux/api/productApi";

import { CustomError } from "@/types/api-types";
import toast from "react-hot-toast";
import { LineSkeleton } from "@/components/Shared/Loader";

interface DataType {
  photo: ReactElement;
  name: string;
  price: number;
  stock: number;
  action: ReactElement;
}

const columns: ColumnDef<DataType>[] = [
  {
    header: "Photo",
    accessorKey: "photo",
  },
  {
    header: "Name",
    accessorKey: "name",
  },
  {
    header: "Price",
    accessorKey: "price",
  },
  {
    header: "Stock",
    accessorKey: "stock",
  },
  {
    header: "Action",
    accessorKey: "action",
  },
];

const Products = () => {

  const { isLoading, isError, error, data } = useAllProductsQuery();

  const [rows, setRows] = useState<DataType[]>([]);

  useEffect(() => {
    if (isError) toast.error((error as CustomError).data?.message);
  }, [isError, error]);

  useEffect(() => {
    if (data)
      setRows(
        data.products.map((i) => ({
          photo: <img src={`${i.photos?.[0]?.url}`} className="w-20"/>,
          name: i.name,
          price: i.price,
          stock: i.stock,
          action: <Link to={`/admin/product/${i._id}`}>Manage</Link>,
        }))
      );
  }, [data]);

  const Table = TableHOC<DataType>(
    columns,
    rows,
    "dashboard-product-box",
    "Products", 
    rows.length > 6
  )();

  return (
    <div className="h-screen grid grid-cols-1 xl:grid-cols-6 bg-gray-50/50">
      <div>
        <AdminSidebar />
      </div>

      <div className="md:col-span-5 flex flex-row overflow-y-auto m-4 p-4 bg-clip-border rounded-xl bg-white text-gray-700 shadow-md">
        <div className="w-full">
          {isLoading ? (
            <>
              <LineSkeleton />
            </>
          ) : (
            Table
          )}
        </div>
        <Link to="/admin/product/new" className="create-product-btn">
          <FaPlus className="bg-red-700 text-white w-8 h-8 rounded-full p-1.5 hover:opacity-65" />
        </Link>
      </div>
    </div>
  );
};

export default Products;
