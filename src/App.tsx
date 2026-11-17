import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { AuthProvider, Guard, SignedOutOnly } from "@/lib/auth";
import { isConfigured } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import Home from "@/pages/Home";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Forgot from "@/pages/Forgot";
import Reset from "@/pages/Reset";
import Subscribe from "@/pages/Subscribe";
import SubscribeReturn from "@/pages/SubscribeReturn";
import Library from "@/pages/Library";
import Teachers from "@/pages/teachers/Teachers";
import Course from "@/pages/teachers/Course";
import Watch from "@/pages/Watch";
import Account from "@/pages/Account";
import { NotFound } from "@/pages/NotFound";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminHome from "@/pages/admin/Overview";
import AdminVideos from "@/pages/admin/Videos";
import NewVideo from "@/pages/admin/VideoNew";
import EditVideo from "@/pages/admin/VideoEdit";
import AdminCourses from "@/pages/admin/Courses";
import AdminPeople from "@/pages/admin/People";
import AdminPayments from "@/pages/admin/Payments";
import AdminSettings from "@/pages/admin/Settings";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotConfigured() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7f5] px-5">
      <div className="card flex max-w-lg flex-col gap-4 p-8">
        <Logo height={44} />
        <h1 className="text-2xl font-extrabold text-deep">Almost there</h1>
        <p className="leading-relaxed text-soft">
          The site is uploaded, but it is not connected to Supabase yet. Open <strong className="text-deep">config.js</strong> in
          the site folder (File Manager &gt; public_html), paste your Supabase Project URL and public (anon) key, save, and reload this page.
        </p>
      </div>
    </div>
  );
}

export function App() {
  if (!isConfigured) return <NotConfigured />;
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignedOutOnly><SignIn /></SignedOutOnly>} />
        <Route path="/signup" element={<SignedOutOnly><SignUp /></SignedOutOnly>} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/subscribe" element={<Guard need="user"><Subscribe /></Guard>} />
        <Route path="/subscribe/return" element={<Guard need="user"><SubscribeReturn /></Guard>} />
        <Route path="/library" element={<Guard need="subscriber"><Library /></Guard>} />
        <Route path="/teachers" element={<Guard need="TEACHER"><Teachers /></Guard>} />
        <Route path="/teachers/:id" element={<Guard need="TEACHER"><Course /></Guard>} />
        <Route path="/watch/:id" element={<Guard need="user"><Watch /></Guard>} />
        <Route path="/account" element={<Guard need="user"><Account /></Guard>} />
        <Route path="/admin" element={<Guard need="admin"><AdminLayout /></Guard>}>
          <Route index element={<AdminHome />} />
          <Route path="videos" element={<AdminVideos />} />
          <Route path="videos/new" element={<NewVideo />} />
          <Route path="videos/:id" element={<EditVideo />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="people" element={<AdminPeople />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
