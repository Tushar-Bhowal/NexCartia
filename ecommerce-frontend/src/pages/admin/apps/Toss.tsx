import { useState } from "react";
import AdminSidebar from "@/components/Shared/admin/AdminSidebar";

const Toss = () => {
  const [angle, setAngle] = useState<number>(0);

  const flipCoin = () => {
    if (Math.random() > 0.5) setAngle((prev) => prev + 180);
    else setAngle((prev) => prev + 360);
  };

  return (
    <div className="admin-container min-h-screen flex bg-gray-50/50">
      <div className="lg:w-64 flex-shrink-0">
        <AdminSidebar />
      </div>
      <main className="dashboard-app-container h-screen flex-1 min-w-0 m-4 g-clip-border rounded-xl bg-white shadow-md p-5 overflow-y-auto">
        <h1 className="text-md md:text-3xl font-bold mt-10 ml-8">Toss</h1>
        <section className="flex flex-col justify-center items-center gap-2 h-full">
          <article
            className="tosscoin"
            onClick={flipCoin}
            style={{
              transform: `rotateY(${angle}deg)`,
            }}
          >
            <div></div>
            <div></div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default Toss;
