import { createContext, useState } from "react";

export const ResourcesContext = createContext({});

export const ResourcesContextProvider = ({ children }) => {
  const [params, setParams] = useState({
    script: "text_uthmani",
    translationId: 85,
  });
  return (
    <ResourcesContext.Provider value={{ params, setParams }}>
      {children}
    </ResourcesContext.Provider>
  );
};
