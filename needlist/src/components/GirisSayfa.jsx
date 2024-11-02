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

    // Prepare the registration data
    const requestData = {
      username: username,
      userpassword: password,
      ...(family_id && { family_id }), // Include family_id only if it has a value
    };

    try {
      // Send registration request to the backend
      const response = await axios.post(
        "http://localhost:8000/register/",
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Check response status for success
      if (response.status === 201 || response.status === 200) {
        // Allow both 201 and 200 statuses
        setErrorMessage("User registered successfully!");

        // Optionally log in the user after successful registration
        await handleLogin();
      } else {
        setErrorMessage(
          response.data.detail || "An error occurred during registration."
        );
      }
    } catch (error) {
      // Handle errors
      if (error.response) {
        if (error.response.status === 409) {
          setErrorMessage("This user is already registered.");
        } else {
          setErrorMessage(
            error.response.data.detail || "An unexpected error occurred."
          );
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        setErrorMessage("No response from the server. Please try again later.");
      } else {
        console.error("Error setting up the request:", error.message);
        setErrorMessage("An error occurred while setting up the request.");
      }
    }
  };

  const handleLogin = async (event) => {
    event && event.preventDefault(); // Prevent default form submission
    setErrorMessage(""); // Clear any previous error message

    const requestData = {
      username: username,
      userpassword: password,
      ...(family_id && { family_id }), // Include family_id if it is defined
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/login/",
        requestData
      );

      if (response.status === 200) {
        const token = response.data.access_token;

        // Ensure token is a valid string before storing and decoding
        if (typeof token === "string" && token.length > 0) {
          console.log("Received token:", token); // Log the token for debugging
          localStorage.setItem("token", token); // Store the token in local storage

          // Decode the token
          const decodedToken = jwtDecode(token);
          console.log("Decoded token:", decodedToken); // Log decoded token for debugging
          const user_id = decodedToken.user_id;

          // Navigate to the ListSayfa component with user details
          navigate("/ListSayfa", {
            state: {
              userName: username,
              user_id: user_id,
              family_id: family_id,
            },
          });
        } else {
          console.error("Token is invalid:", token); // Log invalid token
          setErrorMessage(
            "Invalid token received. Please try logging in again."
          );
        }
      } else {
        setErrorMessage("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        if (error.response.status === 400) {
          const { market_list_items, detail } = error.response.data;

          if (market_list_items) {
            setErrorMessage(
              `Login successful, but password is invalid. Available items: ${market_list_items
                .map((item) => item.item_name)
                .join(", ")}`
            );
          } else if (detail) {
            setErrorMessage(detail); // Display the detail message from the backend
          } else {
            setErrorMessage("Invalid username or password."); // Generic error message
          }
        } else {
          setErrorMessage(error.response.data.detail || "Login failed."); // Handle other error statuses
        }
      } else if (error.request) {
        setErrorMessage(
          "No response received from server. Please check your connection and try again."
        );
      } else {
        setErrorMessage(`Error: ${error.message}`);
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
            {showFamilyList
              ? "Hide Family Account"
              : isLogin
              ? "Join Family Account"
              : "Create Family Account"}
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
