# Needlist Project

## Overview
Needlist is a web application designed to manage and organize your essential needs efficiently. The application utilizes a modern tech stack with the following components:
- **Frontend**: Built with React and styled using ShadCN for a sleek and user-friendly interface.
- **Backend**: Developed with FastAPI in Python, providing a robust and scalable API.
- **Database**: PostgreSQL is used for data storage, ensuring reliability and performance.

---

## Features
- **User Authentication**: Secure sign-up and login functionality.
- **Dynamic Item Management**: Add, update, and delete items on your need list.
- **User-Specific Data**: Each user can only access their own items, ensuring privacy and data integrity.
- **Real-Time Updates**: Reflect changes instantly across the interface.
- **Responsive Design**: Optimized for desktop and mobile devices.

---

## Tech Stack
### Frontend:
- React
- ShadCN (for styling)
- Axios (for API calls)

### Backend:
- FastAPI (Python)
- SQLAlchemy (for database interaction)

### Database:
- PostgreSQL

---

## Installation and Setup
### Prerequisites:
1. **Node.js** (v16 or later)
2. **Python** (v3.10 or later)
3. **PostgreSQL** (installed and running)

### Steps:
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/needlist.git
   cd needlist
2.   Install dependencies::
   ```bash
    pip install -r requirements.txt
    npm install
  
3. Run the FastAPI server:
   ```bash
    uvicorn main:app --reload





