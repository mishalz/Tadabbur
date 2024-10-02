import React, { useContext } from "react";
import "../styling/TitleBar.css";
import { UserContext } from "../context/UserContext";
import { IoPersonCircle } from "react-icons/io5";

function TitleBar({ loginHandler }) {
  const { user } = useContext(UserContext);

  return (
    <div className="title-bar">
      <div className="title-section">
        <img src="quran.png" className="logo" />
        <span className="title">Tadabbur</span>
      </div>
      {user.isLoggedIn && (
        <div className="profile-info">
          <IoPersonCircle className="icon" />{" "}
          <span className="username">{user.username}</span>{" "}
          <button className="auth">Logout</button>
        </div>
      )}
      {!user.isLoggedIn && (
        <button className="auth" onClick={loginHandler}>
          Login
        </button>
      )}
    </div>
  );
}

export default TitleBar;
