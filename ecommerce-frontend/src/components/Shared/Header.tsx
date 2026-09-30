import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/logo.png";
import { IoSearchOutline } from "react-icons/io5";
import { BsCart3 } from "react-icons/bs";
import { AiOutlineUser } from "react-icons/ai";
import { LuLogOut } from "react-icons/lu";
import { RiMenu2Line } from "react-icons/ri";
import { IoClose } from "react-icons/io5";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { User } from "@/types/types";
import { useLogoutMutation } from "@/redux/api/userApi";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { userNotExist } from "@/redux/reducer/userReducer";

interface PropsType {
  user: User | null;
}

const Header = ({ user }: PropsType) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();

  const isAdminRoute = location.pathname.startsWith("/admin");

  const [logout] = useLogoutMutation();
  const cartCount = useSelector((state: RootState) =>
    state.cartReducer.cartItems.reduce((sum, item) => sum + item.quantity, 0)
  );

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);

  const LogoutHandler = async () => {
    try {
      await logout().unwrap();

      dispatch(userNotExist());
      toast.success("Sign Out Successfully");
      window.location.reload();
    } catch {
      toast.error("Sign Out Failed");
    }
  };

  // Only the home hero sits under a transparent navbar; every other page (incl. login) gets a solid bar.
  const isTransparent = location.pathname === "/";

  const navClass = isTransparent
    ? "bg-transparent fixed w-full z-20 top-0 start-0 hover:border-b hover:border-gray-200 hover:bg-white transition-colors duration-300 ease-in-out"
    : "bg-white fixed w-full z-20 top-0 start-0 border-b border-gray-200";

  return (
    <>
      {/* Conditionally render nav */}
      {!isAdminRoute && (
        <nav className={navClass}>
          <div className="px-10 flex flex-wrap items-center justify-between mx-auto p-3">
            <button className="hover:text-gray-600" onClick={openSidebar}>
              <RiMenu2Line className="w-5 h-5" />
            </button>
            <Link to={"/"} className="flex items-center space-x-3">
              <img src={logo} className="h-7 sm:h-10 rounded-lg" alt="Logo" />
            </Link>
            <div className="flex space-x-3 sm:space-x-5 justify-center items-center">
              <Link to={"/search"}>
                <IoSearchOutline className="w-5 h-5" />
              </Link>
              <Link
                to={"/cart"}
                className="relative"
                aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              >
                <BsCart3 className="w-5 h-5" />
                {cartCount > 0 && (
                  <span
                    key={cartCount}
                    aria-hidden="true"
                    className="absolute -right-2.5 -top-2 flex h-4.5 min-w-4.5 animate-in zoom-in-50 items-center justify-center rounded-full bg-green-150 px-1 text-[10px] font-bold leading-none text-white duration-300"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
              {user?._id ? (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <AiOutlineUser className="w-5 h-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {user.role === "admin" && (
                      <Link to="/admin/dashboard">
                        <DropdownMenuItem> Admin</DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuItem>
                      <Link to="/orders">Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <button
                        onClick={LogoutHandler}
                        className="flex justify-center items-center space-x-2"
                      >
                        <span>Logout</span> <LuLogOut className="w-4 h-4" />
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to={"/login"}>
                  <AiOutlineUser className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 bg-stone-800 w-full md:w-[400px] min-h-screen overflow-y-auto transition-transform transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ease-in-out duration-300 z-30`}
      >
        <div>
          <div className="flex justify-between items-center p-8">
            <h1 className="text-2xl font-sora-semibold opacity-60 text-[#DEDEDE]">
              MENU
            </h1>
            <button
              onClick={closeSidebar}
              className="opacity-60 text-[#DEDEDE]"
            >
              <IoClose className="w-6 h-6" />
            </button>
          </div>
          <Separator className="opacity-20 text-[#DEDEDE]" />

          <ul className="p-8 uppercase opacity-60 text-[#DEDEDE]">
            <li>
              <Link
                to={"/"}
                className="block py-2 px-3 text-white rounded hover:text-green-150 md:p-0"
                aria-current="page"
              >
                Home
              </Link>
            </li>
            <Separator className="opacity-20 text-[#DEDEDE] mt-6" />
            <li>
              <Link
                to="/search"
                className="block py-2 px-3 mt-8 text-white rounded hover:text-green-150 md:p-0"
                aria-current="page"
              >
                Product
              </Link>
            </li>
            <Separator className="opacity-20 text-[#DEDEDE] mt-6" />
            <li>
              <Link
                to="/about"
                className="block py-2 px-3 mt-8 text-white rounded hover:text-green-150 md:p-0"
              >
                About
              </Link>
            </li>
            <Separator className="opacity-20 text-[#DEDEDE] mt-6" />
            <li>
              <Link
                to="/contact"
                className="block py-2 px-3 mt-8 text-white rounded hover:text-green-150 md:p-0"
              >
                Contact
              </Link>
            </li>
            <Separator className="opacity-20 text-[#DEDEDE] mt-6" />
            {!user?._id && (
              <>
                <li>
                  <Link
                    to="/login"
                    className="block py-2 px-3 mt-8 text-white rounded hover:text-green-150 md:p-0"
                  >
                    Sign In / Sign Up
                  </Link>
                </li>
                <Separator className="opacity-20 text-[#DEDEDE] mt-6" />
              </>
            )}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Header;
