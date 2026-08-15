import { Navigate, Outlet } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { Loader2 } from "lucide-react";

export default function AdminRoute() {
  const { isAuthed, loading } = useAdmin();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}