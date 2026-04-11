import React, { useContext } from "react";
import { UserContext } from "../context/UserContext";

function TitleBar({ loginHandler }) {
  const { user } = useContext(UserContext);

  return (
    <div className="container mx-auto flex justify-between items-center py-4">
      <div className="flex items-center gap-2">
        <img src="quran.png" width={40} height={40} />
        <span className="font-mono font-medium text-2xl">Tadabbur</span>
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
