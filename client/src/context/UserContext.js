import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  //setting the user state so that it could be accessed by any componnet across the system
  const [user, setUser] = useState({
    username: "",
    isLoggedIn: false,
    token: "",
  });

  // Function to check for a token in localStorage and then validate it by sending a request to the backend
  useEffect(() => {
    const storedToken = localStorage.getItem("token"); //getting the token from the local storage

    if (storedToken) {
      axios
        .get("/auth/validate", {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
        .then((res) => {
          setUser({
            isLoggedIn: true,
            token: storedToken,
            username: res.data.user.username,
          });
        })
        .catch((err) => {
          localStorage.removeItem("token"); //incase the token was not valid, lets remove it from the local storage as well
          setUser({ isLoggedIn: false, token: null, username: null });
        });
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
