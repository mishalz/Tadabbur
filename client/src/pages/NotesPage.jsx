import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import Note from "../components/Note";
import "../styling/Notes.css";

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    fetch(`/content/notes/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.status == 404) setNotes([]);
          else if (data.notes) setNotes(data.notes);
        }
      });
  }, []);
  return (
    <div>
      <h1>Notes</h1>
      <hr />
      <div>
        <div>{notes.length == 0 && <p>No created notes to display.</p>}</div>
        <div className="notes-section">
          {notes.length != 0 &&
            notes.map((note) => <Note key={note._id} note={note} />)}
        </div>
      </div>
    </div>
  );
};

export default NotesPage;
