import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { SearchProvider } from "./contexts/SearchContext";

// Components
import Layout from "./components/Layout/Layout";
import Profile from "./pages/Profile";

// Pages
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Upload from "./pages/Upload";
import ContentDetail from "./pages/ContentDetail";

function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <SearchProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/" /> : <SignUp />}
          />
          <Route path="/login" element={<Login />} />

          {/* Public Profile Page */}
          <Route path="/profile/:username" element={<Profile />} />

          {/* Upload Page */}
          <Route
            path="/upload"
            element={
              isAuthenticated ? (
                <Upload />
              ) : (
                <Navigate to="/login" state={{ from: location }} replace />
              )
            }
          />

          {/* Content Detail Page */}
          <Route path="/content/:id" element={<ContentDetail />} />

          {/* Not Found */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </SearchProvider>
  );
}

export default App;
