from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base



class User(Base):
    __tablename__ = 'users'
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    userpassword = Column(String)
   
    
    # Establish a relationship with Market_List
    need_list_items = relationship("Need_List", back_populates="owner")

class Need_List(Base):
    __tablename__ = 'need_list'
    
    item_id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, index=True)
    item_status = Column(String)
    user_id = Column(Integer, ForeignKey('users.user_id'))

    # Establish the relationship with User
    owner = relationship("User", back_populates="need_list_items")