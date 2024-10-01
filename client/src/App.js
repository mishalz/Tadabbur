import "./App.css";
import Navbar from "./components/Navbar";
import { Route, Routes } from "react-router-dom";
import Homepage from "./pages/Homepage";
import StudySpacePage from "./pages/StudySpacePage";
import ConnectionsPage from "./pages/ConnectionsPage";
import ThemesPage from "./pages/ThemesPage";
import NotesPage from "./pages/NotesPage";
import { routes } from "./utils/Routes";

function App() {
  return (
    <div className="App">
      <Navbar></Navbar>
      <Routes>
        <Route path={routes.home} exact element={<Homepage />} />
        <Route path={routes.studySpace} element={<StudySpacePage />} />
        <Route path={routes.connections} element={<ConnectionsPage />} />
        <Route path={routes.themes} element={<ThemesPage />} />
        <Route path={routes.notes} element={<NotesPage />} />
      </Routes>
    </div>
  );
}

export default App;
