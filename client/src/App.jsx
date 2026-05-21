import Navbar from "./components/Navbar";
import { Route, Routes } from "react-router-dom";
import Homepage from "./pages/Homepage";
import StudySpacePage from "./pages/StudySpacePage";
import CallbackPage from "./pages/CallbackPage";
import TitleBar from "./components/TitleBar";

import { useContext } from "react";
import { UserContext } from "./context/UserContext";
import BookmarksPage from "./pages/BookmarksPage";

function App() {
  const { user } = useContext(UserContext);
  return (
    <div className=" h-screen text-foreground">
      <TitleBar />
      <div className="container mx-auto flex mt-3 gap-3">
        <Navbar className="basis-1/6" />
        <div className="basis-5/6">
          <Routes>
            <Route path="/" exact element={<Homepage />} />
            <Route path="/callback" element={<CallbackPage />} />
            <Route path="/studyspace" element={<StudySpacePage />} />
            {user?.isLoggedIn && (
              <Route path="/bookmarks" element={<BookmarksPage />} />
            )}
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
