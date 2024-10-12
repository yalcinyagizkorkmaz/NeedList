import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Ensure the correct path for your AlertDialog components
import { Button } from "@/components/ui/button";

const Header = ({ userName }) => {
  const navigate = useNavigate();
  const [storedUserName, setStoredUserName] = useState("");

  // Handle logout click event and navigate to GirisSayfa
  const handleClick = () => {
    localStorage.removeItem("token"); // Optionally remove token on logout
    localStorage.removeItem("userName"); // Optionally remove username
    navigate("/GirisSayfa"); // Navigate to GirisSayfa (Login Page)
  };

  // On component mount, load userName from localStorage
  useEffect(() => {
    const savedUserName = localStorage.getItem("userName");
    if (savedUserName) {
      setStoredUserName(savedUserName);
    } else if (userName) {
      setStoredUserName(userName);
      localStorage.setItem("userName", userName); // Store the username
    }
  }, [userName]);

  // Prevent back/forward navigation and redirect to ListSayfa or GirisSayfa
  useEffect(() => {
    const handlePopState = (e) => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/GirisSayfa"); // Redirect to login page if no token
      } else {
        navigate("/ListSayfa"); // Redirect to ListSayfa page if token exists
      }
    };

    window.history.pushState(null, null, window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  return (
    <header className="bg-blue-800 text-white p-4 shadow-md w-full">
      <div className="flex items-center justify-between w-full px-4">
        <h1 className="text-xl font-bold">Welcome, {storedUserName}</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="bg-red-500 text-white hover:bg-white hover:text-red-500">
              Logout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Do you really want to logout?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClick}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
};

export default Header;
