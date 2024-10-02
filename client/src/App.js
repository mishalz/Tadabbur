import "./App.css";
import Navbar from "./components/Navbar";
import { Route, Routes } from "react-router-dom";
import Homepage from "./pages/Homepage";
import StudySpacePage from "./pages/StudySpacePage";
import ConnectionsPage from "./pages/ConnectionsPage";
import ThemesPage from "./pages/ThemesPage";
import NotesPage from "./pages/NotesPage";
import { routes } from "./utils/Routes";
import TitleBar from "./components/TitleBar";
import { useState } from "react";
import LoginModal from "./components/LoginModal";

function App() {
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const handleOpen = () => setOpenAuthModal(true);
  const handleClose = () => setOpenAuthModal(false);
  return (
    <div className="App">
      <TitleBar loginHandler={handleOpen} />
      <div className="page-contents">
        <Navbar></Navbar>
        <div className="main-content">
          <LoginModal openModal={openAuthModal} handleClose={handleClose} />
          <Routes>
            <Route path={routes.home} exact element={<Homepage />} />
            <Route path={routes.studySpace} element={<StudySpacePage />} />
            <Route path={routes.connections} element={<ConnectionsPage />} />
            <Route path={routes.themes} element={<ThemesPage />} />
            <Route path={routes.notes} element={<NotesPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
