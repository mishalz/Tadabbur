import React, { useState } from "react";

import { routes } from "../utils/Routes";
import { House, NotebookPen, Link } from "lucide-react";
import NavbarItem from "./NavbarItem";

const Navbar = ({ className }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Toggle the sidebar open/close state
  const toggleSidebar = () => setIsOpen(!isOpen);

  const activeIconClass = "scale-95 transition-all duration-300 ease-in";
  const iconClass = "w-5 h-5 text-foreground-muted transition-all duration-200 ease-in";
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
    {
      route: routes.connections,
      Icon: <Link className={iconClass} />,
      name: "Connections",
      activeIcon: <Link className={activeIconClass} />,
    },
  ];

  return (
    <>
      <div className={`${className}  `}>
        <div
          className={`toggle-btn ${isOpen ? "open" : "collapsed"}`}
          onClick={toggleSidebar}
        >
          {/* {isOpen ? <ImCross /> : <FaBars />} */}
        </div>
        <nav className="flex flex-col gap-2">
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

          {/* 
          <NavLink
            className="nav-item"
            to={routes.notes}
            activeClassName="active"
          >
          <FaStickyNote className="icon" /> 
            {isOpen && <span>Notes</span>}
          </NavLink> 
          */}
        </nav>
      </div>
    </>
  );
};

export default Navbar;
