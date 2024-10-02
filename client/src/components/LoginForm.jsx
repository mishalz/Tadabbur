import React, { useContext, useEffect, useState } from "react";
import "../styling/AuthForm.css";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import Spinner from "react-bootstrap/Spinner";

function LoginForm({ showLogin, handleClose }) {
  const [submit, setSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputs, setInputs] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const { setUser } = useContext(UserContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmit(true);
  };

  useEffect(() => {
    if (submit) {
      setError(false);
      setSubmit(false);
      const data = { email: inputs.email, password: inputs.password };

      setIsLoading(true);
      const response = fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data), // to convert form data to JSON
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          if (data.success) {
            handleClose();
            localStorage.setItem("token", data.token);
            setUser({
              isLoggedIn: true,
              token: data.token,
              username: data.username,
            });
          } else if (
            data.status == 422 ||
            data.status == 409 ||
            data.status == 401
          ) {
            setError(data.message);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          setIsLoading(false);
          console.log(err);
        });
    }
  }, [submit]);
  return (
    <>
      <div className="heading">Login form</div>
      <form>
        <div>
          <label>Enter your email:</label>
          <input
            type="text"
            name="email"
            value={inputs.email}
            onChange={(event) =>
              setInputs((input) => {
                return { ...input, email: event.target.value };
              })
            }
          />
        </div>
        <div>
          <label>Enter your password:</label>
          <input
            type="password"
            name="password"
            value={inputs.password}
            onChange={(event) =>
              setInputs((input) => {
                return { ...input, password: event.target.value };
              })
            }
          />
        </div>
        <button onClick={handleSubmit}>
          {isLoading ? <Spinner /> : "Login"}
        </button>
      </form>
      <p className="error-message">{error}</p>
      <button
        onClick={() => {
          showLogin(false);
        }}
      >
        Register
      </button>
    </>
  );
}

export default LoginForm;
