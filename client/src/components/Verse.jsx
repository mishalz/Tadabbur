import React, { useContext, useEffect, useState } from "react";
import { Link, Plus } from "lucide-react";

import { UserContext } from "../context/UserContext";

function Verse({ verse }) {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [dataToFetch, setDataToFetch] = useState(false);
  const [fetchedData, setFetchedData] = useState([]);
  const [connections, setConnections] = useState([]);

  const { user } = useContext(UserContext);

  const addConnectionHandler = () => {};

  useEffect(() => {
    if (dataToFetch) {
      fetch(`/api/content/connections/${verse.verse_key}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          if (data.success) {
            setFetchedData(data.connections || []);
          }
        })
        .finally(() => {
          setDataToFetch(false);
        });
    }
  }, [dataToFetch]);
  const displayConnections = () => {
    setSectionOpen((x) => !x);
    setDataToFetch(true);
  };

  return (
    <>
      <hr className="mb-6 text-foreground-muted/50"></hr>
      <div className="flex flex-column gap-3 justify-between">
        <div className="basis-0.5/12 flex flex-col items-center gap-3">
          <div className="text-sm text-foreground-bg-muted">
            {verse.verse_key}
          </div>
        </div>
        <div className="basis-10/12 pr-2 flex flex-col gap-3 mb-6">
          <div className="text-xl text-right">{verse.text_uthmani}</div>
          <div className="translation">{verse.translations[0].text}</div>
        </div>
        <div className="basis-1/12 flex flex-col items-center gap-2">
          <span className="flex gap-1 bg-foreground-bg border border-foreground-border/10 px-3 py-1 rounded-full cursor-pointer text-foreground-muted hover:text-foreground hover:bg-primary/20 transition-colors duration-200 ease-in-out">
            3 <Link className="w-4" onClick={displayConnections} />
          </span>
          <button
            className="text-sm text-foreground-bg-muted cursor-pointer hover:text-primary"
            onClick={addConnectionHandler}
          >
            <Plus className="w-5" />
          </button>
        </div>
      </div>
      {sectionOpen && (
        <div className="py-5 bg-foreground-bg transition duration-200 ease-in-out rounded-xl p-10">
          {fetchedData && fetchedData.length != 0 && "we have data to display"}
          {fetchedData && fetchedData.length == 0 && (
            <p>No Connections to display.</p>
          )}
          {!fetchedData && <p>No data to display.</p>}
        </div>
      )}
    </>
  );
}

export default Verse;
