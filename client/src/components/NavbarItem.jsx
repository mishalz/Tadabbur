import React from "react";
import { NavLink } from "react-router-dom";

function NavbarItem({ route, activeIcon, Icon, name, isOpen }) {
  return (
    <NavLink className="ease-in flex gap-2 items-center" to={route}>
      {({ isActive }) => {
        return (
          <>
            {isActive ? activeIcon : Icon}
            {isOpen && (
              <span
                className={`transition-all duration-200 ease-in ${isActive ? "text-foreground scale-105" : "text-foreground-muted"}`}
              >
                {name}
              </span>
            )}
          </>
        );
      }}
    </NavLink>
  );
}

export default NavbarItem;
