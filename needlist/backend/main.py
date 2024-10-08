import logging
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from model import User, Need_List  # Use relative import
from typing import List
from starlette.middleware.base import BaseHTTPMiddleware





# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update with your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

class UserLogin(BaseModel):
    username: str
    userpassword: str

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

@app.post("/token", response_model=dict)
def token_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == form_data.username).first()
    if not db_user or not verify_password(form_data.password, db_user.userpassword):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": db_user.user_id},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}





from fastapi import HTTPException, status

@app.post("/register/")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    
    if db_user:
        # If user is already registered, raise HTTP 409 Conflict
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already registered"
        )
    
    # If the user is not found, register the new user
    hashed_password = get_password_hash(user.userpassword)
    new_user = User(username=user.username, userpassword=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User registered successfully", "user_id": new_user.user_id}


# Login User Endpoint
@app.post("/login/")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.userpassword, db_user.userpassword):
        raise HTTPException(status_code=400, detail="Invalid username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": db_user.user_id}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Market List Endpoints
@app.post("/list/", response_model=MarketListResponse)
async def create_market_list_item(
    item: MarketListCreate, 
    db: Session = Depends(get_db), 
    user_id: int = Depends(get_current_user)
):
    new_item = Need_List(
        item_name=item.item_name,
        item_status=item.item_status,
        user_id=user_id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return MarketListResponse(
        item_id=new_item.item_id,
        item_name=new_item.item_name,
        item_status=new_item.item_status,
        user_id=new_item.user_id
    )

@app.get("/list/", response_model=List[MarketListResponse])
async def get_market_list_items(
    db: Session = Depends(get_db), 
    user_id: int = Depends(get_current_user)
):
    items = db.query(Need_List).filter(Need_List.user_id == user_id).all()
    return [MarketListResponse(
        item_id=item.item_id,
        item_name=item.item_name,
        item_status=item.item_status,
        user_id=item.user_id
    ) for item in items]

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