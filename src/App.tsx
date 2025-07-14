import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { SearchProvider } from "./contexts/SearchContext";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./contexts/SocketContext";

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
import Followers from "./pages/Followers";
import Following from "./pages/Following";
import TradingUpload from "./pages/TradingUpload";
import TradingPage from "./pages/TradingPage";
import TradeRequests from "./pages/TradeRequests";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import Notification from "./pages/Notificatoin";

function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <SocketProvider>
      <SearchProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#4ade80",
                secondary: "#fff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
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

            {/*Setting Page */}
            <Route
              path="/settings"
              element={
                isAuthenticated ? (
                  <Settings />
                ) : (
                  <Navigate to="/settings" state={{ from: location }} replace />
                )
              }
            />

            {/* Content Detail Page */}
            <Route path="/content/:id" element={<ContentDetail />} />

            {/* Followers/Following Pages */}
            <Route
              path="/profile/:username/followers"
              element={<Followers />}
            />
            <Route
              path="/profile/:username/following"
              element={<Following />}
            />

            {/* Trading Upload Page */}
            <Route path="/trading/upload" element={<TradingUpload />} />

            {/* Trading Content Page */}
            <Route path="/trading" element={<TradingPage />} />

            {/* Trade Requests Page */}
            <Route path="/trading/requests" element={<TradeRequests />} />

            {/* Collections Pages */}
            <Route
              path="/collections"
              element={<Collections isOwnProfile={true} />}
            />
            <Route path="/collections/:id" element={<CollectionDetail />} />

            {/* Messages Page */}
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:userId" element={<Messages />} />

            {/*Notification Page */}
            <Route path="/notification" element={<Notification />} />

            {/* Not Found */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </SearchProvider>
    </SocketProvider>
  );
}

export default App;
