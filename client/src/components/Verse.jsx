import React, { useContext, useEffect, useState } from "react";
import "../styling/Verse.css";
import { FaPenAlt, FaConnectdevelop } from "react-icons/fa";
import { BiCategoryAlt } from "react-icons/bi";
import { UserContext } from "../context/UserContext";

function Verse({ verse }) {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [dataToFetch, setDataToFetch] = useState(null);
  const [fetchedData, setFetchedData] = useState([]);

  const { user } = useContext(UserContext);

  const addThemeHandler = () => {};
  const addNoteHandler = () => {};
  const addBookmarkHandler = () => {};
  const addConnectionHandler = () => {};

  useEffect(() => {
    if (dataToFetch) {
      fetch(`/content/${dataToFetch}/${verse.verse_key}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (dataToFetch == "connections")
              setFetchedData(data.connections || []);
            if (dataToFetch == "themes") setFetchedData(data.themes || []);
            if (dataToFetch == "notes") setFetchedData(data.notes || []);
          }
        });
    }
  }, [dataToFetch]);
  const displayConnections = () => {
    setSectionOpen((x) => !x);
    setDataToFetch("connections");
  };
  const displayNotes = () => {
    setSectionOpen((x) => !x);
    setDataToFetch("notes");
  };
  const displayThemes = () => {
    setSectionOpen((x) => !x);
    setDataToFetch("themes");
  };

  return (
    <>
      <hr></hr>
      <div className="verse-section">
        <div className="verse-data">
          <div className="verse-number">Verse {verse.verse_number}</div>
          <FaPenAlt className="icon" onClick={displayNotes} />
          <FaConnectdevelop className="icon" onClick={displayConnections} />
          <BiCategoryAlt className="icon" onClick={displayThemes} />
        </div>
        <div className="verse">
          <div className="arabic-text">{verse.text_indopak}</div>
          <div className="translation">{verse.translations[0].text}</div>
        </div>
        <div className="verse-options">
          <button onClick={addThemeHandler}>Add To theme</button>
          <button onClick={addNoteHandler}>Add Note</button>
          <button onClick={addBookmarkHandler}>Add Bookmark</button>
          <button onClick={addConnectionHandler}>Add Connection</button>
        </div>
      </div>
      {sectionOpen && (
        <div className="data-section">
          {fetchedData && fetchedData.length != 0 && "we have data to display"}
          {fetchedData && fetchedData.length == 0 && (
            <p>No {dataToFetch} to display.</p>
          )}
          {!fetchedData && <p>No data to display.</p>}
        </div>
      )}
    </>
  );
}

export default Verse;
