import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NewDeckView from './NewDeckView';

function App() {
  return (
    <Routes>
      {/* "/" にアクセスした場合、自動で "/new-deck-view" にリダイレクト */}
      <Route path="/" element={<Navigate to="/new-deck-view" replace />} />
      <Route path="/new-deck-view" element={<NewDeckView />} />
    </Routes>
  );
}

export default App;
