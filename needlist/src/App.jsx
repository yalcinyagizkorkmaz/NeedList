import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GirisSayfa from "./components/GirisSayfa";
import ListSayfa from "./components/ListSayfa";

function App() {
  return (
    <>
      <div className="flex justify-center items-center h-screen">
        <Router>
          <Routes>
            <Route path="/" element={<GirisSayfa />} />
            <Route path="/GirisSayfa" element={<GirisSayfa />} />
            <Route path="/ListSayfa" element={<ListSayfa />} />
          </Routes>
        </Router>
      </div>
    </>
  );
}

export default App;
