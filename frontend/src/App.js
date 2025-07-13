// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Chatpage from './pages/Chatpage';
import ChatProvider from './Context/ChatProvider'; // Add this import

function App() {
  return (
    <Router>
      <ChatProvider> {/* Add ChatProvider here */}
        <Switch>
          <Route path="/" component={Homepage} exact />
          <Route path="/chats" component={Chatpage} />
        </Switch>
      </ChatProvider> {/* Close ChatProvider here */}
    </Router>
  );
}

export default App;