
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
import firebase_admin
from firebase_admin import auth
from datetime import datetime
from typing import Optional, List

# Use absolute import for dependencies
import dependencies

router = APIRouter()

class PhoneVerificationRequest(BaseModel):
    token: str

class UserCreate(BaseModel):
    uid: str
    email: Optional[EmailStr] = None
    name: str
    role: str

class User(BaseModel):
    uid: str
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: str
    phone: Optional[str] = None
    createdAt: datetime

@router.post("/verify-phone", summary="Verify Firebase Phone Token", response_model=User)
async def verify_phone_token(request: PhoneVerificationRequest, db=Depends(dependencies.get_db)):
    """
    Verifies a Firebase ID token from the client. If the token is valid,
    it checks if a user with that phone number already exists in the database.
    If the user exists, it returns the user's data.
    If not, it creates a new user with the phone number and a default 'customer' role.
    """
    try:
        decoded_token = auth.verify_id_token(request.token, check_revoked=True)
        phone_number = decoded_token.get("phone_number")
        uid = decoded_token.get("uid")

        if not phone_number or not uid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number or UID not found in Firebase token.",
            )

        user = await db.users.find_one({"phone": phone_number})

        if user:
            return User(**user)

        new_user_data = {
            "uid": uid,
            "phone": phone_number,
            "role": "customer",
            "createdAt": datetime.utcnow(),
            "email": None,
            "name": None,
            "addresses": []
        }
        
        await db.users.insert_one(new_user_data)
        
        # Adjust the structure for the response model
        created_user = await db.users.find_one({"uid": uid})
        return User(**created_user)

    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token.",
        )
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has been revoked.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}",
        )

@router.get("/users/phone/{phone_number}", response_model=User)
async def get_user_by_phone(phone_number: str, db=Depends(dependencies.get_db)):
    """
    Retrieves a user from the database based on their phone number.
    """
    user = await db.users.find_one({"phone": phone_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)
