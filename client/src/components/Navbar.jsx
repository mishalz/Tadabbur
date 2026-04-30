import React, { useContext, useState } from "react";

import { routes } from "../utils/Routes";
import { House, NotebookPen, Link } from "lucide-react";
import NavbarItem from "./NavbarItem";
import { UserContext } from "@/context/UserContext";

const Navbar = ({ className }) => {
  const { user } = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(true);

  // Toggle the sidebar open/close state
  const toggleSidebar = () => setIsOpen(!isOpen);

  const activeIconClass = "scale-95 transition-all duration-300 ease-in";
  const iconClass =
    "w-5 h-5 text-foreground-muted transition-all duration-200 ease-in";
  const navbarItems = [
    {
      route: routes.home,
      Icon: <House className={iconClass} />,
      activeIcon: <House className={activeIconClass} />,
      name: "Home",
    },
    {
      route: routes.studySpace,
      Icon: <NotebookPen className={iconClass} />,
      name: "Study Space",
      activeIcon: <NotebookPen className={activeIconClass} />,
    },
  ];
  if (user?.isLoggedIn) {
    navbarItems.push({
      route: routes.connections,
      Icon: <Link className={iconClass} />,
      name: "Connections",
      activeIcon: <Link className={activeIconClass} />,
    });
  }

  return (
    <>
      <div className={`${className} pt-3 relative`}>
        <div
          className={`toggle-btn ${isOpen ? "open" : "collapsed"} `}
          onClick={toggleSidebar}
        >
          {/* {isOpen ? <ImCross /> : <FaBars />} */}
        </div>
        <div className="sticky">
          <nav className="flex flex-col gap-3  ">
            {navbarItems.map((item) => (
              <NavbarItem
                key={item.name}
                route={item.route}
                Icon={item.Icon}
                activeIcon={item.activeIcon}
                name={item.name}
                isOpen={isOpen}
              />
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Navbar;
