import React from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import "../styling/NotificationModal.css";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  p: 4,
};
function NotificationModal({ success, message, openModal, handleClose }) {
  return (
    <Modal
      open={openModal}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <div className={success ? "success" : "failure"}>{message}</div>
      </Box>
    </Modal>
  );
}

export default NotificationModal;
