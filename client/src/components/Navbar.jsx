import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { routes } from "../utils/Routes";
import {
  FaHome,
  FaBook,
  FaLink,
  FaStickyNote,
  FaThLarge,
  FaBars,
} from "react-icons/fa";
import { ImCross } from "react-icons/im";
import "../styling/Navbar.css";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(true);

  // Toggle the sidebar open/close state
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <div className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
        <div
          className={`toggle-btn ${isOpen ? "open" : "collapsed"}`}
          onClick={toggleSidebar}
        >
          {isOpen ? <ImCross /> : <FaBars />}
        </div>
        <nav className="nav">
          <NavLink
            className="nav-item"
            to={routes.home}
            exact
            activeClassName="active"
          >
            <FaHome className="icon" />
            {isOpen && <span>Home</span>}
          </NavLink>

          <NavLink
            className="nav-item"
            to={routes.studySpace}
            activeClassName="active"
          >
            <FaBook className="icon" />
            {isOpen && <span>Study Space</span>}
          </NavLink>

          <NavLink
            className="nav-item"
            to={routes.connections}
            activeClassName="active"
          >
            <FaLink className="icon" />
            {isOpen && <span>Connections</span>}
          </NavLink>

          <NavLink
            className="nav-item"
            to={routes.themes}
            activeClassName="active"
          >
            <FaThLarge className="icon" />
            {isOpen && <span>Themes</span>}
          </NavLink>

          <NavLink
            className="nav-item"
            to={routes.notes}
            activeClassName="active"
          >
            <FaStickyNote className="icon" />
            {isOpen && <span>Notes</span>}
          </NavLink>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
