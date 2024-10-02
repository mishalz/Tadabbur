import React from "react";
import "../styling/Note.css";

function Note({ note }) {
  console.log(note.colour);
  const textColor = getContrastColor(note.colour);
  const dateObject = new Date(note.updatedAt);
  console.log(dateObject);

  function getContrastColor(colour) {
    //removing the '#' if present
    colour = colour.replace("#", "");

    //parsing the r, g, b values
    const r = parseInt(colour.substring(0, 2), 16);
    const g = parseInt(colour.substring(2, 4), 16);
    const b = parseInt(colour.substring(4, 6), 16);

    //calculating the relative luminance
    const luminance =
      0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);

    // If luminance is less than 0.5, return white (#FFFFFF), otherwise return black (#000000)
    return luminance < 0.5 ? "#FFFFFF" : "#000000";
  }

  return (
    <>
      <div className="note-section">
        <div
          style={{
            backgroundColor: note.colour,
            color: textColor,
            padding: "10px",
            height: "100%",
            borderRadius: "10px",
          }}
        >
          <div className="note-data">
            <div className="note-key">{note.verseKey}</div>

            <div className="note-heading">{note.heading}</div>
          </div>
          <hr />
          <div className="note-date">
            Last Update At: {dateObject.getDate()}/{dateObject.getMonth()}/
            {dateObject.getFullYear()} {dateObject.getHours()}:
            {dateObject.getMinutes()}
          </div>
        </div>
      </div>
    </>
  );
}

export default Note;
