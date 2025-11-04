/**
 * Main App Component with Routing
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { Layout } from "../components/Layout";
import { UploadPage } from "../pages/Upload";
import { DashboardPage } from "../pages/Dashboard";
import { InferencePage } from "../pages/Inference";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(12px)",
            color: "#fff",
            border: "1px solid rgba(100, 116, 139, 0.3)",
            borderRadius: "12px",
            padding: "12px 16px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="inference" element={<InferencePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
