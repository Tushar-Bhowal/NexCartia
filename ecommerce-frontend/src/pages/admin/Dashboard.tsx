import { BsSearch } from "react-icons/bs";
import AdminSidebar from "../../components/Shared/admin/AdminSidebar";
import { FaRegBell } from "react-icons/fa";
import userImg from "../../assets/userpic.png";
import { HiTrendingDown, HiTrendingUp } from "react-icons/hi";
import { BarChart, DoughnutChart } from "../../components/Shared/admin/Charts";
import { BiMaleFemale } from "react-icons/bi";
import Table from "../../components/Shared/admin/DashBoardTable";
import { useStatsQuery } from "@/redux/api/dashboardApi";
import { Navigate } from "react-router-dom";
import { LineSkeleton } from "@/components/Shared/Loader";
import { getLastMonths } from "@/utils/Features";

const { last6Months: months } = getLastMonths();

const Dashboard = () => {
  const { isLoading, data, isError } = useStatsQuery();
  const dataStats = data?.stats;
  const stats = dataStats!;

  if (isError) return <Navigate to={"/"} />;

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      <div className="lg:w-64 flex-shrink-0">
        <AdminSidebar />
      </div>
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        {isLoading ? (
          <LineSkeleton />
        ) : (
          <>
            <div className="m-5">
              <div className="flex flex-row mt-5 gap-2 sm:gap-10">
                <div className="flex pl-2 shadow-md items-center w-full rounded-xl bg-white">
                  <BsSearch />
                  <input
                    type="text"
                    className="w-full border-none bg-transparent px-4 py-2 text-gray-400 outline-none focus:outline-none"
                    placeholder="Search for data, users, docs"
                  />
                </div>
                <div className="flex gap-2 sm:gap-5">
                  <FaRegBell className="h-10 w-10 cursor-pointer" />
                  <img
                    className="h-10 w-10 cursor-pointer"
                    src={userImg}
                    alt="User"
                  />
                </div>
              </div>
            </div>

            {/*widget section  */}
            <section className="m-5">
              <div className="grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
                <WidgetItem
                  percent={stats.changePercent.revenue}
                  amount={true}
                  value={stats.count.revenue}
                  heading="Revenue"
                  color="rgb(0, 115, 255)"
                />
                <WidgetItem
                  percent={stats.changePercent.user}
                  value={stats.count.user}
                  color="rgb(0 198 202)"
                  heading="Users"
                />
                <WidgetItem
                  percent={stats.changePercent.order}
                  value={stats.count.order}
                  color="rgb(255 196 0)"
                  heading="Transactions"
                />
                <WidgetItem
                  percent={stats.changePercent.product}
                  value={stats.count.product}
                  color="rgb(76 0 255)"
                  heading="Products"
                />
              </div>
            </section>

            {/*Graph section  */}

            <section className="m-5">
              <div className="grid md:grid-cols-4 gap-5">
                {/*revenue-chart section  */}

                <div className="col-span-3 w-11/12 md:w-full  bg-clip-border rounded-xl bg-white text-gray-700 shadow-md p-5 flex flex-col justify-center text-center gap-5">
                  <h2 className="block antialiased tracking-normal text-md md:text-2xl font-semibold leading-snug ">
                    Revenue & Transaction
                  </h2>
                  <BarChart
                    labels={months}
                    data_1={stats.chart.revenue}
                    data_2={stats.chart.order}
                    title_1="Revenue"
                    title_2="Transaction"
                    bgColor_1="rgb(0, 115, 255)"
                    bgColor_2="rgba(53, 162, 235, 0.8)"
                  />
                </div>

                {/*dashboard section  */}

                <div className="col-span-3 w-11/12 md:col-span-1 bg-clip-border rounded-xl bg-white text-gray-700 shadow-md flex justify-center text-center flex-col gap-5 p-10">
                  <h2 className="block antialiased tracking-normal text-2xl font-semibold leading-snug ">
                    Inventory
                  </h2>

                  <div>
                    {stats.categoryCount.map((i) => {
                      const [heading, value] = Object.entries(i)[0];
                      return (
                        <CategoryItem
                          key={heading}
                          value={value}
                          heading={heading}
                          color={`hsl(${value * 4}, ${value}%, 50%)`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="transaction-container m-5">
              <div className="gender-chart">
                <h2>Gender Ratio</h2>

                <DoughnutChart
                  labels={["Female", "Male"]}
                  data={[stats.userRatio.female, stats.userRatio.male]}
                  backgroundColor={[
                    "hsl(340, 82%, 56%)",
                    "rgba(53, 162, 235, 0.8)",
                  ]}
                  cutout={90}
                />

                <p>
                  <BiMaleFemale />
                </p>
              </div>

              <Table data={stats.latestTransaction} />
              <style>
                {`
      @media screen and (max-width: 1200px) {
        .transaction-container {
          justify-content: center;
          flex-wrap: wrap;
          padding: 2rem;
          height: unset;
        }
      }
    `}
              </style>
            </section>
          </>
        )}

        {/*Bar section  */}
      </main>
    </div>
  );
};
interface WidgetItemProps {
  heading: string;
  value: number;
  percent: number;
  color: string;
  amount?: boolean;
}

const WidgetItem = ({
  heading,
  value,
  percent,
  color,
  amount = false,
}: WidgetItemProps) => (
  <article className="widget">
    <div className=" flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 shadow-md">
      <div className="flex flex-row justify-between items-center mr-5">
        <div className="p-4">
          <p className="block antialiased text-sm leading-normal font-normal text-blue-gray-60">
            {heading}
          </p>
          <h4 className="block antialiased tracking-normal text-2xl font-semibold leading-snug text-blue-gray-900">
            {amount ? `₹${value}` : value}
          </h4>
        </div>
        <div
          className="widget-circle"
          style={{
            background: `conic-gradient(
        ${color} ${(Math.abs(percent) / 100) * 360}deg,
        rgb(255, 255, 255) 0
      )`,
          }}
        >
          <span
            style={{
              color,
            }}
          >
            {percent > 0 && `${percent > 10000 ? 9999 : percent}%`}
            {percent < 0 && `${percent < -10000 ? -9999 : percent}%`}
          </span>
        </div>
      </div>

      <div className="border-t  border-blue-gray-50 p-4">
        <p className="antialiased text-base leading-relaxed font-normal text-blue-gray-600">
          {percent > 0 ? (
            <span className="text-green-500 flex flex-row gap-1 items-center">
              <HiTrendingUp /> +{`${percent > 10000 ? 9999 : percent}%`}
            </span>
          ) : (
            <span className="text-red-500 flex flex-row gap-1 items-center">
              <HiTrendingDown /> {`${percent < -10000 ? -9999 : percent}%`}
            </span>
          )}
        </p>
      </div>
    </div>
  </article>
);

interface CategoryItemProps {
  color: string;
  value: number;
  heading: string;
}

const CategoryItem = ({ color, value, heading }: CategoryItemProps) => (
  <div className="category-item flex flex-col">
    <div className="flex justify-between mb-1 mt-3">
      <span className="text-base font-medium ">{heading}</span>
      <span className="text-sm font-medium">{value}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="h-2.5 rounded-full"
        style={{
          backgroundColor: color,
          width: `${value}%`,
        }}
      ></div>
    </div>
  </div>
);

export default Dashboard;
