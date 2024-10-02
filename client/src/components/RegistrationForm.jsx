import React from "react";

function RegistrationForm({ showLogin }) {
  return (
    <>
      <div className="heading">Registration form</div>
      <form>
        <input name="myInput" />
      </form>
      <button
        onClick={() => {
          showLogin(true);
        }}
      >
        Register
      </button>
    </>
  );
}

export default RegistrationForm;
