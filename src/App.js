import { useEffect, useState } from "react";
import Chat from "./components/Chat";
import Login from "./components/Login";


function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [loggedOut,setLoggedOut] = useState(false);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);



  return (

    <div className="App">
      {loggedIn ? (
        <Chat socket={socket}  user={user} setLoggedIn={setLoggedIn} setLoggedOut={setLoggedOut} />
      ) : (
        <Login setLoggedIn={setLoggedIn} setSocket={setSocket} setUser={setUser} loggedOut={loggedOut} />
      )}

    </div>
  );
}

export default App;
