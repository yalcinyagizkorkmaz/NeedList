import * as React from "react";
import { useNavigate } from "react-router-dom";

import { jwtDecode } from "jwt-decode"; // Düzeltilmiş import
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios"; // HTTP istekleri için axios kullanıyoruz
import { useState } from "react";

export function GirisSayfa() {
  const [showFamilyList, setShowFamilyList] = React.useState(false);
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");

  const familyMembers = [
    { id: 1, username: "Hasan Arda Kaşıkçı" },
    { id: 2, username: "Aziz Yıldırım" },
    { id: 3, username: "Sertaç Şanlı" },
    { id: 4, username: "Volkan Demirel" },
  ];

  // Family listesi açılıp kapandığında bu fonksiyon çalışır.
  const toggleFamilyList = () => {
    setShowFamilyList(!showFamilyList);
  };

  //Register Fonk
  const handleRegister = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const requestData = {
      username: username,
      userpassword: password,
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/register/",
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        setErrorMessage("User registered successfully!");
        // After successful registration, log in the user
        handleLogin();
      } else {
        setErrorMessage(
          response.data.detail || "An error occurred during registration."
        );
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 409) {
          // Conflict error indicates the user is already registered
          setErrorMessage("This user is already registered.");
        } else {
          setErrorMessage(
            error.response.data.detail || "An unexpected error occurred."
          );
        }
      } else {
        setErrorMessage("Error setting up request.");
      }
    }
  };

  const handleLogin = async (event) => {
    event && event.preventDefault();
    setErrorMessage("");

    try {
      const response = await axios.post("http://localhost:8000/login/", {
        username,
        userpassword: password,
      });

      if (response.status === 200) {
        const token = response.data.access_token;
        localStorage.setItem("token", token);

        const decodedToken = jwtDecode(token);
        const user_id = decodedToken.user_id;

        console.log("Navigating to ListSayfa..."); // Log to check if this line is reached
        navigate("/ListSayfa", {
          state: { userName: username, user_id: user_id },
        });
      } else {
        setErrorMessage("Login failed. Please try again.");
      }
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.detail || "Login failed.");
      } else {
        setErrorMessage("No response received from server.");
      }
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>NeedList</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
        {errorMessage && (
          <p className="text-red-500 text-xs italic mb-4">{errorMessage}</p>
        )}
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="***********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="flex justify-between space-x-2">
          <Button
            variant="outline"
            className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
            onClick={handleLogin} // Login fonksiyonu tetikleniyor
          >
            Login
          </Button>
          <Button
            variant="outline"
            className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
            onClick={handleRegister} // Register fonksiyonu tetikleniyor
          >
            Register
          </Button>

          <Button
            variant="outline"
            className="border-green-400 text-red-400 hover:bg-orange-400"
            onClick={toggleFamilyList} // Family listesi açılıp kapanıyor
          >
            Family Account
          </Button>
        </div>

        {showFamilyList && ( // Eğer showFamilyList true ise liste görünür.
          <div className="mt-4 p-2 border rounded-lg bg-gray-100">
            <h3 className="text-lg font-semibold mb-2">Family List</h3>
            <ul className="list-disc pl-5 space-y-1">
              {familyMembers.map((member) => (
                <li key={member.id}>
                  {member.name} (ID: {member.id}) {/* ID ve isim gösterimi */}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
export default GirisSayfa;
