import logo from "../../assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
const Footer = () => {
  const location = useLocation();
  // Hidden on admin and the auth page (login is a self-contained, full-height screen).
  const isHidden =
    location.pathname.startsWith("/admin") ||
    location.pathname === "/login";
  return (
    <>
      {!isHidden && (
        <section className="bg-black-150">
          <footer className="max-w-7xl mx-auto w-full px-3 py-12 sm:p-12 xl:px-0 xl:py-12 ">
            <div className="container mx-auto px-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-32">
                <div>
                  <Link to={"/"} className="flex items-center ">
                    <img
                      src={logo}
                      className="h-6 mb-3 rounded-md"
                      alt="FlowBite Logo"
                    />
                  </Link>
                  <p className="text-gray-400">
                    Your trusted fashion
                    <br />
                    companion
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-4">NAVIGATION</h4>
                  <ul className="space-y-2">
                    {["Home", "Search", "About", "Contact"].map((item) => (
                      <li key={item}>
                        <Link
                          to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                          className="text-gray-400 hover:text-gray-200"
                        >
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-4">CATEGORIES</h4>
                  <ul className="space-y-2">
                    {[
                      { label: "Men", to: "/search?gender=male" },
                      { label: "Women", to: "/search?gender=female" },
                    ].map((item) => (
                      <li key={item.label}>
                        <Link
                          to={item.to}
                          className="text-gray-400 hover:text-gray-200"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex">
                    <a
                      href="https://github.com/Tushar-Bhowal/mern-ecommerce-2025"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub repository"
                    >
                      <FaGithub className="w-6 h-6 text-white hover:text-green-150 ms-5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="text-center mt-12 text-white">
                All Rights Reserved By ©NexCartia
              </div>
            </div>
          </footer>
        </section>
      )}
    </>
  );
};

export default Footer;
