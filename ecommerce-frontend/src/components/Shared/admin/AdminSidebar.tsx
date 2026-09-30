import { useEffect, useState } from "react";
import { IconType } from "react-icons";
import { AiFillFileText } from "react-icons/ai";
import {
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaGamepad,
  FaStopwatch,
} from "react-icons/fa";
import { HiMenuAlt4 } from "react-icons/hi";
import { MdMail } from "react-icons/md";
import logo from "../../../assets/logo.png";
import { IoIosPeople } from "react-icons/io";
import {
  RiCoupon3Fill,
  RiDashboardFill,
  RiShoppingBag3Fill,
} from "react-icons/ri";
import { Link, Location, useLocation } from "react-router-dom";

const AdminSidebar = () => {
  const location = useLocation();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [phoneActive, setPhoneActive] = useState<boolean>(
    window.innerWidth < 1024
  );

  const resizeHandler = () => {
    setPhoneActive(window.innerWidth < 1024);
  };

  useEffect(() => {
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
    <>
      {phoneActive && (
        <button id="hamburger" onClick={() => setShowModal(true)}>
          <HiMenuAlt4 />
        </button>
      )}

      <aside
        className={`bg-white fixed inset-0 z-[100] h-screen w-64 rounded-xl transition-transform duration-300 xl:translate-x-0  ${
          phoneActive
            ? showModal
              ? "translate-x-0 overflow-y-auto"
              : "-translate-x-80"
            : ""
        }`}
      >
        <Link to={"/"} className="">
          <img
            src={logo}
            className="ml-3 mt-5 h-7 sm:h-10 rounded-lg"
            alt="Logo"
          />
        </Link>
        <DivOne location={location} />
        <DivTwo location={location} />
        <DivThree location={location} />

        {phoneActive && (
          <button id="close-sidebar" onClick={() => setShowModal(false)}>
            Close
          </button>
        )}
      </aside>
    </>
  );
};

const DivOne = ({ location }: { location: Location }) => (
  <div className="m-4 flex flex-col gap-4">
    <h5 className="block antialiased font-sans text-sm leading-normal text-slate-500 font-black uppercase opacity-75">
      Dashboard
    </h5>
    <ul>
      <Li
        url="/admin/dashboard"
        text="Dashboard"
        Icon={RiDashboardFill}
        location={location}
      />
      <Li
        url="/admin/product"
        text="Product"
        Icon={RiShoppingBag3Fill}
        location={location}
      />
      <Li
        url="/admin/customer"
        text="Customer"
        Icon={IoIosPeople}
        location={location}
      />
      <Li
        url="/admin/transaction"
        text="Transaction"
        Icon={AiFillFileText}
        location={location}
      />
      <Li
        url="/admin/messages"
        text="Messages"
        Icon={MdMail}
        location={location}
      />
    </ul>
  </div>
);

const DivTwo = ({ location }: { location: Location }) => (
  <div className="m-4 flex flex-col gap-4">
    <h5 className="block antialiased font-sans text-sm leading-normal text-slate-500 font-black uppercase opacity-75">
      Charts
    </h5>
    <ul>
      <Li
        url="/admin/chart/bar"
        text="Bar"
        Icon={FaChartBar}
        location={location}
      />
      <Li
        url="/admin/chart/pie"
        text="Pie"
        Icon={FaChartPie}
        location={location}
      />
      <Li
        url="/admin/chart/line"
        text="Line"
        Icon={FaChartLine}
        location={location}
      />
    </ul>
  </div>
);

const DivThree = ({ location }: { location: Location }) => (
  <div className="m-4 flex flex-col gap-4">
    <h5 className="block antialiased font-sans text-sm leading-normal text-slate-500 font-black uppercase opacity-75">
      Apps
    </h5>
    <ul>
      <Li
        url="/admin/app/stopwatch"
        text="Stopwatch"
        Icon={FaStopwatch}
        location={location}
      />
      <Li
        url="/admin/app/coupon"
        text="Coupon"
        Icon={RiCoupon3Fill}
        location={location}
      />
      <Li
        url="/admin/app/toss"
        text="Toss"
        Icon={FaGamepad}
        location={location}
      />
    </ul>
  </div>
);

interface LiProps {
  url: string;
  text: string;
  location: Location;
  Icon: IconType;
}
const Li = ({ url, text, location, Icon }: LiProps) => (
  <li
    className="rounded-xl"
    style={{
      backgroundColor: location.pathname.includes(url)
        ? "rgba(0,115,255,0.1)"
        : "white",
    }}
  >
    <Link
      to={url}
      style={{
        color: location.pathname.includes(url) ? "rgb(0,115,255)" : "black",
      }}
    >
      <div className="middle none  font-bold center transition-all text-xs py-3 rounded-lg text-black w-full flex items-center gap-4 px-4 capitalize">
        <Icon className="w-5 h-5" />
        <p className="block antialiased text-base leading-relaxed text-inherit font-medium capitalize">
          {text}
        </p>
      </div>
    </Link>
  </li>
);

export default AdminSidebar;
