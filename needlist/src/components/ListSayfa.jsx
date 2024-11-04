import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Header from "./Header";
import { jwtDecode } from "jwt-decode"; // Correct import of jwt-decode
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ListSayfa = () => {
  const { state } = useLocation();
  const userName = state?.userName || "Guest";

  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [familyId, setFamilyId] = useState(null); // Add state for familyId

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const decodedToken = jwtDecode(token);

      // Check if the token has expired
      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.removeItem("token"); // Remove expired token
        return;
      }

      // Get family_id from token if it exists
      const familyIdFromToken = decodedToken?.family_id || "";
      setFamilyId(familyIdFromToken);
    } catch (error) {
      console.error("Error decoding token", error);
      return;
    }

    // Set up query parameters based on family_id presence
    const fetchUrl = familyId
      ? `http://127.0.0.1:8000/list/?family_id=${familyId}`
      : `http://127.0.0.1:8000/list/`;

    axios
      .get(fetchUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setItems(
          response.data.map((item) => ({
            text: item.item_name,
            status: item.item_status,
            itemId: item.item_id,
          }))
        );
      })
      .catch((error) => {
        console.error("Error fetching items!", error);
      });
  }, [familyId]);

  // Export functions
  const exportToJson = () => {
    const json = JSON.stringify(items, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "items.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCsv = () => {
    const csvRows = [
      ["Item Name", "Status"], // header row
      ...items.map((item) => [item.text, item.status]), // data rows
    ];
    const csvString = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "items.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddItem = (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return;

    const decodedToken = jwtDecode(token);
    const userId = decodedToken?.user_id || null;

    if (inputValue.trim() !== "" && userId) {
      axios
        .post(
          "http://localhost:8000/list/",
          {
            item_name: inputValue,
            item_status: "Pending",
            user_id: userId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((response) => {
          setItems([
            ...items,
            {
              text: response.data.item_name,
              status: response.data.item_status,
              itemId: response.data.item_id,
            },
          ]);
          setInputValue("");
        })
        .catch((error) => {
          console.error("Error creating the item:", error);
        });
    }
  };

  const handleUpdateStatus = (index) => {
    const item = items[index];
    const token = localStorage.getItem("token");
    const decodedToken = jwtDecode(token);
    const userId = decodedToken?.user_id || null;

    axios
      .put(
        `http://localhost:8000/list/${item.itemId}`,
        {
          item_name: item.text,
          item_status: "Updated",
          user_id: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        const updatedItems = [...items];
        updatedItems[index].status = "Updated";
        setItems(updatedItems);
      })
      .catch((error) => {
        console.error("Error updating the status!", error);
      });
  };

  const handleDone = (index) => {
    const item = items[index];
    const token = localStorage.getItem("token");
    const decodedToken = jwtDecode(token);
    const userId = decodedToken?.user_id || null;

    axios
      .put(
        `http://localhost:8000/list/${item.itemId}`,
        {
          item_name: item.text,
          item_status: "Done",
          user_id: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        const newItems = [...items];
        newItems[index].status = "Done";
        setItems(newItems);
      })
      .catch((error) => {
        console.error("There was an error updating the item!", error);
      });
  };

  const handleSaveEdit = (index) => {
    const item = items[index];
    const token = localStorage.getItem("token");
    const decodedToken = jwtDecode(token);
    const userId = decodedToken?.user_id || null;

    axios
      .put(
        `http://localhost:8000/list/${item.itemId}`,
        {
          item_name: editText,
          item_status: "Pending",
          user_id: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        const newItems = [...items];
        newItems[index].text = editText;
        newItems[index].status = "Pending";
        setItems(newItems);
        setEditIndex(null);
        setEditText("");
      })
      .catch((error) => {
        console.error("There was an error updating the item!", error);
      });
  };

  const handleDelete = (index) => {
    const item = items[index];
    const token = localStorage.getItem("token");

    axios
      .delete(`http://localhost:8000/list/${item.itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
      })
      .catch((error) => {
        console.error(
          "There was an error deleting the item!",
          error.response ? error.response.data : error
        );
      });
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <Header userName={userName} family_id={familyId} />
      <div className="flex justify-center items-start flex-grow mt-20">
        <Card className="w-full max-w-[90%] mx-auto">
          <CardHeader>
            <CardTitle>Add Item to Market List</CardTitle>
            <CardDescription className="mt-4">
              <div className="mt-8">
                {" "}
                {/* Add margin-top for more spacing */}
                <form className="flex space-x-4" onSubmit={handleAddItem}>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg p-4 w-full text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter item..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    type="submit"
                    style={{
                      height: "60px", // Adjust the height as needed
                      backgroundColor: "#007bff", // Bootstrap blue color
                      color: "white",
                      borderColor: "#007bff",
                      borderWidth: "2px", // Optional: Adjust border width
                    }}
                    className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    ADD
                  </Button>
                </form>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="mt-6 space-y-2">
              {items.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between border-b border-gray-200 py-3 text-lg"
                >
                  {editIndex === index ? (
                    <input
                      className="flex-1 border border-gray-300 rounded-lg p-2"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                  ) : (
                    <span
                      className={`flex-1 break-words ${
                        item.status === "Done"
                          ? "line-through text-gray-500"
                          : ""
                      }`}
                    >
                      {item.text}
                    </span>
                  )}
                  <div className="flex-shrink-0 flex space-x-2">
                    {editIndex === index ? (
                      <Button
                        variant="outline"
                        className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        onClick={() => handleSaveEdit(index)}
                      >
                        Save
                      </Button>
                    ) : (
                      <>
                        <Button
                          className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          onClick={() => {
                            setEditIndex(index);
                            setEditText(item.text);
                          }}
                        >
                          Update
                        </Button>
                        <Button
                          className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                          onClick={() => handleDone(index)}
                        >
                          Done
                        </Button>
                        <Button
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                          onClick={() => handleDelete(index)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <div className="mt-4 flex space-x-4">
              <button
                className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                onClick={exportToJson}
              >
                Export to JSON
              </button>
              <button
                className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                onClick={exportToCsv}
              >
                Export to CSV
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ListSayfa;
