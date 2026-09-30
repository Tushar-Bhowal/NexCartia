import { useEffect } from "react";
import AdminSidebar from "@/components/Shared/admin/AdminSidebar";
import { LineChart } from "@/components/Shared/admin/Charts";
import { LineSkeleton } from "@/components/Shared/Loader";
import { useLineQuery } from "@/redux/api/dashboardApi";
import { CustomError } from "@/types/api-types";
import { getLastMonths } from "@/utils/Features";
import toast from "react-hot-toast";

const { last12Months: months } = getLastMonths();
const BarCharts = () => {
  const { isLoading, data, error, isError } = useLineQuery();

  const products = data?.charts.products || [];
  const users = data?.charts.users || [];
  const revenue = data?.charts.revenue || [];
  const discount = data?.charts.discount || [];

  useEffect(() => {
    if (isError) toast.error((error as CustomError).data?.message);
  }, [isError, error]);
  return (
    <div className="admin-container xl:grid xl:grid-cols-6 min-h-screen bg-gray-50/50">
      <div>
        <AdminSidebar />
      </div>
      {isLoading ? (
        <LineSkeleton />
      ) : (
        <>
          <main className="chart-container m-4 md:col-span-5 g-clip-border rounded-xl bg-white shadow-md p-5 overflow-y-auto">
            <h1 className="text-md md:text-3xl font-bold mt-10 ml-8">
              Line Charts
            </h1>
            <section className="w-4/5 mx-auto my-16 flex flex-col gap-10">
              <LineChart
                data={users}
                label="Users"
                borderColor="rgb(53, 162, 255)"
                backgroundColor="rgba(53, 162, 255,0.5)"
                labels={months}
              />
              <h2 className="text-md md:text-2xl uppercase text-center text-gray-700">
                Active Users
              </h2>
            </section>
            <section className="w-4/5 mx-auto my-16 flex flex-col gap-10">
              <LineChart
                data={products}
                backgroundColor={"hsla(269,80%,40%,0.4)"}
                borderColor={"hsl(269,80%,40%)"}
                label="Products"
                labels={months}
              />
              <h2 className="text-md md:text-2xl uppercase text-center text-gray-700">
                Total Products (SKU)
              </h2>
            </section>

            <section className="w-4/5 mx-auto my-16 flex flex-col gap-10">
              <LineChart
                data={revenue}
                backgroundColor={"hsla(129,80%,40%,0.4)"}
                borderColor={"hsl(129,80%,40%)"}
                label="Revenue"
                labels={months}
              />
              <h2 className="text-md md:text-2xl uppercase text-center text-gray-700">
                Total Revenue
              </h2>
            </section>

            <section className="w-4/5 mx-auto my-16 flex flex-col gap-10">
              <LineChart
                data={discount}
                backgroundColor={"hsla(29,80%,40%,0.4)"}
                borderColor={"hsl(29,80%,40%)"}
                label="Discount"
                labels={months}
              />
              <h2 className="text-md md:text-2xl uppercase text-center text-gray-700">
                Discount Allotted
              </h2>
            </section>
          </main>
        </>
      )}
    </div>
  );
};

export default BarCharts;
