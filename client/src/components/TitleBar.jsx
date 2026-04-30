import React, { useContext } from "react";

import Login from "./Login";

function TitleBar() {


  return (
    <div className="container mx-auto flex justify-between items-center py-4">
      <div className="flex items-center gap-2">
        <img src="quran.png" width={40} height={40} />
        <span className="font-mono font-medium text-2xl">Tadabbur</span>
      </div>
      <Login />
    </div>
  );
}

export default TitleBar;
