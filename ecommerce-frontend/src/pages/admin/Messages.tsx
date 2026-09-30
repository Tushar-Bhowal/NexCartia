import AdminSidebar from "@/components/Shared/admin/AdminSidebar";
import TableHOC from "@/components/Shared/admin/TableHOC";
import { LineSkeleton } from "@/components/Shared/Loader";
import {
  useAllMessagesQuery,
  useAllSubscribersQuery,
  useDeleteMessageMutation,
  useDeleteSubscriberMutation,
} from "@/redux/api/messageApi";
import { CustomError } from "@/types/api-types";
import { responseToast } from "@/utils/Features";
import { ColumnDef } from "@tanstack/react-table";
import { ReactElement, useEffect } from "react";
import toast from "react-hot-toast";
import { FaTrash } from "react-icons/fa";

interface MessageRow {
  date: string;
  name: string;
  email: string;
  message: ReactElement;
  action: ReactElement;
}

interface SubscriberRow {
  date: string;
  email: string;
  action: ReactElement;
}

const messageColumns: ColumnDef<MessageRow>[] = [
  { header: "Date", accessorKey: "date" },
  { header: "Name", accessorKey: "name" },
  { header: "Email", accessorKey: "email" },
  { header: "Message", accessorKey: "message" },
  { header: "Action", accessorKey: "action" },
];

const subscriberColumns: ColumnDef<SubscriberRow>[] = [
  { header: "Subscribed", accessorKey: "date" },
  { header: "Email", accessorKey: "email" },
  { header: "Action", accessorKey: "action" },
];

const formatDate = (date: string) => new Date(date).toLocaleDateString();

const Messages = () => {
  const messages = useAllMessagesQuery();
  const subscribers = useAllSubscribersQuery();
  const [deleteMessage] = useDeleteMessageMutation();
  const [deleteSubscriber] = useDeleteSubscriberMutation();

  const error = messages.error || subscribers.error;
  useEffect(() => {
    if (error) toast.error((error as CustomError).data?.message);
  }, [error]);

  const messageRows: MessageRow[] =
    messages.data?.messages.map((m) => ({
      date: formatDate(m.createdAt),
      name: m.name,
      email: m.email,
      message: <p className="max-w-md whitespace-pre-wrap">{m.message}</p>,
      action: (
        <button
          aria-label={`Delete message from ${m.name}`}
          onClick={async () => responseToast(await deleteMessage(m._id), null, "")}
        >
          <FaTrash />
        </button>
      ),
    })) ?? [];

  const subscriberRows: SubscriberRow[] =
    subscribers.data?.subscribers.map((s) => ({
      date: formatDate(s.createdAt),
      email: s.email,
      action: (
        <button
          aria-label={`Remove ${s.email}`}
          onClick={async () =>
            responseToast(await deleteSubscriber(s._id), null, "")
          }
        >
          <FaTrash />
        </button>
      ),
    })) ?? [];

  const MessagesTable = TableHOC<MessageRow>(
    messageColumns,
    messageRows,
    "dashboard-product-box",
    "Contact Messages",
    messageRows.length > 6
  )();

  const SubscribersTable = TableHOC<SubscriberRow>(
    subscriberColumns,
    subscriberRows,
    "dashboard-product-box",
    "Newsletter Subscribers",
    subscriberRows.length > 6
  )();

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      <div className="fixed top-0 left-0 h-full lg:w-[250px]">
        <AdminSidebar />
      </div>

      <div className="lg:ml-[250px] flex-1 flex flex-col gap-6 overflow-y-auto m-4">
        <div className="w-full p-4 bg-clip-border rounded-xl bg-white text-gray-700 shadow-md">
          {messages.isLoading ? <LineSkeleton /> : MessagesTable}
          {!messages.isLoading && messageRows.length === 0 && (
            <p className="text-sm text-gray-500">No messages yet.</p>
          )}
        </div>
        <div className="w-full p-4 bg-clip-border rounded-xl bg-white text-gray-700 shadow-md">
          {subscribers.isLoading ? <LineSkeleton /> : SubscribersTable}
          {!subscribers.isLoading && subscriberRows.length === 0 && (
            <p className="text-sm text-gray-500">No subscribers yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
