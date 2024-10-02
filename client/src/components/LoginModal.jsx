import React, { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import "./../styling/LoginModal.css";
import LoginForm from "./LoginForm";
import RegistrationForm from "./RegistrationForm";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  p: 4,
};

function LoginModal({ openModal, handleClose }) {
  const [login, setLogin] = useState(true);
  return (
    <Modal
      open={openModal}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <div className="auth-form">
          {login && (
            <LoginForm showLogin={setLogin} handleClose={handleClose} />
          )}
          {!login && <RegistrationForm showLogin={setLogin} />}
        </div>
      </Box>
    </Modal>
  );
}

export default LoginModal;
