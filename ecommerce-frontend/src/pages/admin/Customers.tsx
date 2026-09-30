import AdminSidebar from "../../components/Shared/admin/AdminSidebar";
import TableHOC from "../../components/Shared/admin/TableHOC";
import { FaTrash } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect } from "react";
import defaultAvatar from "@/assets/userpic.png";
import { ReactElement } from "react";
import { useAllUsersQuery, useDeleteUserMutation } from "@/redux/api/userApi";
import { LineSkeleton } from "@/components/Shared/Loader";
import toast from "react-hot-toast";
import { CustomError } from "@/types/api-types";
import { responseToast } from "@/utils/Features";

interface DataType {
  avatar: ReactElement;
  name: string;
  email: string;
  gender: string;
  role: string;
  action: ReactElement;
}

const columns: ColumnDef<DataType>[] = [
  {
    header: "Avatar",
    accessorKey: "avatar",
  },
  {
    header: "Name",
    accessorKey: "name",
  },
  {
    header: "Gender",
    accessorKey: "gender",
  },
  {
    header: "Email",
    accessorKey: "email",
  },
  {
    header: "Role",
    accessorKey: "role",
  },
  {
    header: "Action",
    accessorKey: "action",
  },
];

const Customers = () => {
  const { isLoading, data, isError, error } = useAllUsersQuery();

  const [deleteUser] = useDeleteUserMutation();

  const deleteHandler = async (userId: string) => {
    const res = await deleteUser(userId);
    responseToast(res, null, "");
  };

  useEffect(() => {
    if (isError) toast.error((error as CustomError).data?.message);
  }, [isError, error]);

  const rows: DataType[] =
    data?.users.map((i) => ({
      avatar: (
        <img
          className="h-10 w-10 rounded-lg object-cover"
          src={i.photo || defaultAvatar}
          alt={i.name}
        />
      ),
      name: i.name,
      email: i.email,
      gender: i.gender,
      role: i.role,
      action: (
        <button
          onClick={() => deleteHandler(i._id)}
          aria-label={`Delete ${i.name}`}
        >
          <FaTrash />
        </button>
      ),
    })) ?? [];

  const Table = TableHOC<DataType>(
    columns,
    rows,
    "dashboard-product-box",
    "Customers",
    rows.length > 6
  )();

  return (
    <div className="h-screen flex bg-gray-50/50">
      <div className="lg:w-64 flex-shrink-0">
        <AdminSidebar />
      </div>

      <div className="flex-1 min-w-0 flex flex-row overflow-y-auto m-4 p-4 bg-clip-border rounded-xl bg-white text-gray-700 shadow-md">
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

export default Customers;
