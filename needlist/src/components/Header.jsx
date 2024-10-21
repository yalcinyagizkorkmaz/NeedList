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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const Header = ({ userName, family_id }) => {
  const navigate = useNavigate();
  const [storedUserName, setStoredUserName] = useState("");
  const [storedFamilyid, setStoredFamilyid] = useState("");

  const handleClick = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("family_id"); // family_id'yi de temizle
    navigate("/GirisSayfa");
  };

  useEffect(() => {
    const savedUserName = localStorage.getItem("userName");
    const savedFamily_id = localStorage.getItem("family_id");

    if (savedUserName) {
      setStoredUserName(savedUserName);
    } else if (userName) {
      setStoredUserName(userName);
      localStorage.setItem("userName", userName); // Kullanıcı adını sakla
    }

    if (savedFamily_id) {
      setStoredFamilyid(savedFamily_id);
    } else if (family_id) {
      setStoredFamilyid(family_id);
      localStorage.setItem("family_id", family_id); // family_id'yi sakla
    }
  }, [userName, family_id]);

  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      window.history.pushState(null, null, window.location.href); // Sayfayı yeniden ekleyerek geri/ileri tuşlarını etkisiz hale getir
      alert(
        "Sayfadan ayrılmak için sadece 'Logout' butonunu kullanabilirsiniz."
      );
    };

    // popstate olayını dinle
    window.addEventListener("popstate", handlePopState);

    // Geçerli durumu geçmişe ekle
    window.history.pushState(null, null, window.location.href);

    return () => {
      // popstate olayını temizle
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // Tarayıcı uyarı mesajı gösterir
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <header className="bg-blue-800 text-white p-4 shadow-md w-full">
      <div className="flex items-center justify-between w-full px-4">
        <h1 className="text-xl font-bold">Welcome, {storedUserName}</h1>
        {storedFamilyid && (
          <h1 className="text-xl font-bold">Family ID: {storedFamilyid}</h1>
        )}
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
