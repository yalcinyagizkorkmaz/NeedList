import * as React from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useState } from "react";

function GirisSayfa() {
  const [showFamilyList, setShowFamilyList] = React.useState(false);
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = React.useState("");
  const [family_id, setFamilyCode] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();

  const toggleFamilyList = () => {
    setShowFamilyList(!showFamilyList);
  };
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

      if (response.status === 200) {
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

  const handleAxiosError = (error) => {
    if (error.response) {
      console.error(error.response.data);
      setErrorMessage(error.response.data.detail || "An error occurred.");
    } else {
      console.error(error);
      setErrorMessage("No response received from server.");
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader className="relative">
        <CardTitle>NeedList</CardTitle>
        <Avatar className="absolute top-3 right-3">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
        {errorMessage && (
          <p className="text-red-500 text-xs italic mb-4">{errorMessage}</p>
        )}
      </CardHeader>

      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Username</Label>
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
            {showFamilyList && (
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="familyCode">Family Code</Label>
                <Input
                  id="family_id"
                  placeholder="***********"
                  value={family_id}
                  onChange={(e) => setFamilyCode(e.target.value)}
                />
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 w-full">
        <div className="flex flex-col space-y-2 w-full">
          {loading ? (
            <Button disabled className="w-full">
              Loading...
            </Button>
          ) : isLogin ? (
            <Button
              variant="outline"
              className="w-full border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
              onClick={handleLogin}
            >
              Sign In
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
              onClick={handleRegister}
            >
              Sign Up
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
            onClick={toggleFamilyList}
          >
            {showFamilyList ? "Hide Family Account" : "Join Family Account"}
          </Button>
        </div>
        <div className="flex justify-center mt-2">
          <Label className="text-center">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-500 hover:underline cursor-pointer"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </span>
          </Label>
        </div>
      </CardFooter>
    </Card>
  );
}

export default GirisSayfa;
