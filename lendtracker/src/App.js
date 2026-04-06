import LoginPage from "./Pages/loginPage/Login.jsx";
import { LoginForm } from "./Pages/loginPage/LoginForm.jsx";
import { RegisterForm } from "./Pages/loginPage/RegisterForm.jsx";
import { useState, useEffect } from "react";
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "firebase/auth";
import DashBoard from "./Pages/dashBoardPage/DashBoard.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./Pages/dashBoardPage/dbComponents/ProtectedRoutes.jsx";
import Home from "./Pages/dashBoardPage/SubPages/Home.jsx";
import Client from "./Pages/dashBoardPage/SubPages/Client.jsx";
import NotFound from "./Pages/404Page/404Page.jsx";
import Stimulator from "./Pages/dashBoardPage/SubPages/Stimulator.jsx";
import RecentlyDeleted from "./Pages/dashBoardPage/SubPages/RecentlyDeleted.jsx";
import { Provider } from "react-redux";
import { store } from "./learn/store.js";
import DataFetcherWrapper from "./Pages/dashBoardPage/DataFetcherWrapper.jsx";
import "./index.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const savedData = localStorage.getItem("loginData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (Date.now() - parsed.loginTime > 1000 * 60 * 60) {
        auth.signOut();
        localStorage.removeItem("loginData");
        setUser(null);
        alert("Session expired. Please login again");
      } else {
        setUser(parsed.userDetails);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) setUser(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
    setUser(null);
    localStorage.removeItem("homePageFilter");
  };

  if (loading) {
    return <div></div>;
  }
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage onLoginSuccess={setUser} />}>
            <Route index element={<LoginForm />} />
            <Route path="register" element={<RegisterForm />} />
          </Route>
          <Route
            path="/"
            element={
              <ProtectedRoute user={user}>
                <DataFetcherWrapper user={user}>
                  <DashBoard onLogOut={handleLogout} user={user} />
                </DataFetcherWrapper>
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="clients/:clientId" element={<Client />} />
            <Route path="stimulator" element={<Stimulator />} />
            <Route path="recently-deleted" element={<RecentlyDeleted />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
