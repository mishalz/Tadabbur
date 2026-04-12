import Navbar from "./components/Navbar";
import { Route, Routes } from "react-router-dom";
import Homepage from "./pages/Homepage";
import StudySpacePage from "./pages/StudySpacePage";
import ConnectionsPage from "./pages/ConnectionsPage";
import TitleBar from "./components/TitleBar";
import { useState } from "react";
import LoginModal from "./components/LoginModal";

function App() {
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const handleOpen = () => setOpenAuthModal(true);
  const handleClose = () => setOpenAuthModal(false);

  return (
    <div className=" h-screen text-foreground">
      <TitleBar loginHandler={handleOpen} />
      <div className="container mx-auto flex mt-3">
        <Navbar className="basis-1/6" />
        <div className="basis-5/6">
          <LoginModal openModal={openAuthModal} handleClose={handleClose} />
          <Routes>
            <Route path="/" exact element={<Homepage />} />
            <Route path="/studyspace" element={<StudySpacePage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
