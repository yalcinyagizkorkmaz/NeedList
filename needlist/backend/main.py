import logging
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel,validator
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from model import User, Need_List  # Use relative import
from typing import List,Optional
from starlette.middleware.base import BaseHTTPMiddleware





# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Allow specific methods
    allow_headers=["Authorization", "Content-Type"],  # Allow necessary headers
)


# Logging middleware
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        logging.info(f"Request path: {request.url.path} Method: {request.method}")
        response = await call_next(request)
        logging.info(f"Response status: {response.status_code}")
        return response

app.add_middleware(LoggingMiddleware)

# JWT Configuration
SECRET_KEY = "21fd240954b9329f58d52fd6f731c5d338a22d3bf0d45be5c48c79e724d4ffa5"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User models
class UserCreate(BaseModel):
    username: str
    userpassword: str
    family_id: Optional[int] = None  # Make family_id optional with a default value of None

   


class UserLogin(BaseModel):
    username: str
    userpassword: str
    family_id: Optional[int] = None  # Make family_id optional with a default value of None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class MarketListCreate(BaseModel):
    item_name: str
    item_status: str

class MarketListUpdate(BaseModel):
    item_status: str
    item_name: str

class MarketListResponse(BaseModel):
    item_id: int
    item_name: str
    item_status: str
    user_id: int
    family_id: Optional[int] = None 

    class Config:
        orm_mode = True

   

# Get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError as e:
        logging.error(f"JWTError: {e}")
        raise credentials_exception
    return user_id

# Password Hashing Functions
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
    

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Token Creation Function
def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "user_id": data["user_id"]})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Register User Endpoint

@app.get("/")
def read_root():
    return {"message": "Welcome to the Market List API!"}


@app.post("/token", response_model=dict)
def token_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == form_data.username).first()
    if not db_user or not verify_password(form_data.password, db_user.userpassword):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": db_user.user_id, "family_id": db_user.family_id},  # Include family_id in token data
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}



import logging

# Configure logging at the beginning of your main application file
logging.basicConfig(level=logging.INFO)

@app.post("/register/")
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if the username is already registered
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already registered"
        )

    # Hash the password and create a new user
    hashed_password = get_password_hash(user.userpassword)
    new_user = User(
        username=user.username,
        userpassword=hashed_password,
        family_id=user.family_id  # family_id can be None
    )
    
    # Add and commit the new user without adding any list items
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Return a message with an empty list
    return {
        "message": "User registered successfully",
        "user_id": new_user.user_id,
        "market_list": []  # Explicitly return an empty list for new users
    }



# Login User Endpoint
@app.post("/login/", response_model=dict)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    # Check if the provided family_id exists in the database
    family_exists = db.query(User).filter(User.family_id == user.family_id).first()

    # Fetch the list items for the specified family_id regardless of user authentication
    market_list_items = db.query(Need_List).filter(Need_List.family_id == user.family_id).all()

    # Prepare the response data with the list of items
    market_list_response = [
        MarketListResponse(
            item_id=item.item_id,
            item_name=item.item_name,
            item_status=item.item_status,
            user_id=item.user_id,
            family_id=item.family_id
        )
        for item in market_list_items
    ]

    # If family_id is valid but password does not match, you can still return the items
    if family_exists:
        # Optionally, validate the provided password
        if not verify_password(user.userpassword, family_exists.userpassword):
            # Optional: Log the failed password attempt or return a message
            pass  # You can log this or handle it as needed

        # Create the access token for the user if authentication is successful
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": family_exists.username, "user_id": family_exists.user_id, "family_id": family_exists.family_id},
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "market_list_items": market_list_response
        }

    # If the family_id is not valid (no corresponding user found), still return the items found (could be empty)
    return {
        "access_token": None,
        "token_type": None,
        "market_list_items": market_list_response
    }

    # Check if the provided family_id exists in the database
    family_exists = db.query(User).filter(User.family_id == user.family_id).first()

    # If no such family_id exists, raise an error
    if not family_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid family_id"
        )

    # Fetch the list items for the specified family_id
    market_list_items = db.query(Need_List).filter(Need_List.family_id == family_exists.family_id).all()

    # Prepare the response data with the list of items
    market_list_response = [
        MarketListResponse(
            item_id=item.item_id,
            item_name=item.item_name,
            item_status=item.item_status,
            user_id=item.user_id
        )
        for item in market_list_items
    ]

    # Validate the provided password against the user's stored password
    password_is_valid = verify_password(user.userpassword, family_exists.userpassword)

    if not password_is_valid:
        # Optional: You can choose to log this failed attempt or take further action.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password"
        )

    # Create the access token for the user
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": family_exists.username, "user_id": family_exists.user_id, "family_id": family_exists.family_id},
        expires_delta=access_token_expires
    )

    # Return the access token and the list of market items
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "market_list_items": market_list_response
    }



@app.get("/list/", response_model=List[MarketListResponse])
async def get_market_list_items(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
    family_id: Optional[int] = None  # Add family_id as an optional parameter
):
    # Query to get items based on family_id if it exists, otherwise by user_id
    if family_id:
        items = db.query(Need_List).filter(Need_List.family_id == family_id).all()
    else:
        items = db.query(Need_List).filter(Need_List.user_id == user_id).all()

    # Check if items exist
    if not items:
        raise HTTPException(
            status_code=404,
            detail="No market list items found for this user or family."
        )

    # Return the list of items using the MarketListResponse model
    return [
        MarketListResponse(
            item_id=item.item_id,
            item_name=item.item_name,
            item_status=item.item_status,
            user_id=item.user_id,
            family_id=item.family_id  # Include family_id in the response if relevant
        ) for item in items
    ]



@app.post("/list/", response_model=MarketListResponse)
async def create_market_list_item(
    item: MarketListCreate, 
    db: Session = Depends(get_db), 
    user_id: int = Depends(get_current_user)
):
    new_item = Need_List(
        item_name=item.item_name,
        item_status=item.item_status,
        user_id=user_id,
       
       
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return MarketListResponse(
        item_id=new_item.item_id,
        item_name=new_item.item_name,
        item_status=new_item.item_status,
        user_id=new_item.user_id,
        family_id=new_item.family_id
        
    )



@app.put("/list/{item_id}", response_model=MarketListResponse)
async def update_market_list_status(
    item_id: int, 
    item_data: MarketListUpdate, 
    db: Session = Depends(get_db), 
    user_id: int = Depends(get_current_user)
):
    item = db.query(Need_List).filter(Need_List.item_id == item_id, Need_List.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found or not owned by you")
    
    item.item_status = item_data.item_status
    item.item_name = item_data.item_name
    db.commit()
    db.refresh(item)

    return MarketListResponse(
        item_id=item.item_id,
        item_name=item.item_name,
        item_status=item.item_status,
        user_id=item.user_id
    )

@app.delete("/list/{item_id}", response_model=MarketListResponse)
async def delete_item(
    item_id: int, 
    db: Session = Depends(get_db), 
    user_id: int = Depends(get_current_user)
):
    item = db.query(Need_List).filter(Need_List.item_id == item_id, Need_List.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found or not owned by you")
    
    db.delete(item)
    db.commit()

    return MarketListResponse(
        item_id=item.item_id,
        item_name=item.item_name,
        item_status=item.item_status,
        user_id=item.user_id
    )

