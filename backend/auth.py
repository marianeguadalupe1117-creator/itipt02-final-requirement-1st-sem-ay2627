from hashlib import sha256
from secrets import token_urlsafe
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from mysql.connector import IntegrityError
from pydantic import BaseModel, EmailStr, Field, SecretStr, StringConstraints
from pwdlib import PasswordHash

from database import get_connection, run_sql

router = APIRouter(prefix="/api/auth")
password_hash = PasswordHash.recommended()
dummy_hash = password_hash.hash(token_urlsafe())
SESSION_COOKIE = "prepmaster_session"


class LoginRequest(BaseModel):
    email: EmailStr = Field(max_length=150)
    password: SecretStr = Field(min_length=8, max_length=48)


class RegisterRequest(LoginRequest):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    confirm_password: SecretStr = Field(min_length=8, max_length=48)


class User(BaseModel):
    id: int
    name: str


def hash_token(token: str) -> str:
    return sha256(token.encode()).hexdigest()


def session_user(
    token: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> User | None:
    if not token:
        return None

    with get_connection() as connection:
        users = run_sql(
            connection,
            "SELECT u.userID AS id, u.name FROM user_sessions AS s "
            "JOIN users AS u ON u.userID = s.userID "
            "WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()",
            (hash_token(token),),
        )
    if not users:
        return None
    return User(**users[0])


def require_user(user: Annotated[User | None, Depends(session_user)]) -> User:
    if user is None:
        raise HTTPException(401, "Please log in.")
    return user


@router.post("/register", status_code=201)
def register(account: RegisterRequest, request: Request, response: Response) -> User:
    password = account.password.get_secret_value()
    if password != account.confirm_password.get_secret_value():
        raise HTTPException(422, "Passwords do not match.")

    hashed_password = password_hash.hash(password)
    try:
        with get_connection() as connection:
            result = run_sql(
                connection,
                "INSERT INTO users (name, email, password, username, contactNumber) "
                "VALUES (?, ?, ?, '', '')",
                (account.name, account.email.lower(), hashed_password),
            )
            user = User(id=result["insert_id"], name=account.name)
            start_session(connection, user, request, response)
    except IntegrityError as error:
        if error.errno == 1062:
            raise HTTPException(409, "An account already uses this email.") from error
        raise

    return user


@router.post("/login")
def login(account: LoginRequest, request: Request, response: Response) -> User:
    with get_connection() as connection:
        users = run_sql(
            connection,
            "SELECT userID AS id, name, password FROM users WHERE email = ?",
            (account.email.lower(),),
        )

    stored_hash = dummy_hash
    if users and users[0]["password"].startswith("$argon2"):
        stored_hash = users[0]["password"]

    valid_password = password_hash.verify(account.password.get_secret_value(), stored_hash)
    if not users or not valid_password:
        raise HTTPException(401, "Email or password is incorrect.")
    user = User(**users[0])

    with get_connection() as connection:
        start_session(connection, user, request, response)
    return user


def start_session(connection, user: User, request: Request, response: Response) -> None:
    token = token_urlsafe(32)
    old_token = request.cookies.get(SESSION_COOKIE)
    if old_token:
        run_sql(connection, "DELETE FROM user_sessions WHERE token_hash = ?", (hash_token(old_token),))
    run_sql(
        connection,
        "INSERT INTO user_sessions (token_hash, userID, expires_at) "
        "VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL 7 DAY)",
        (hash_token(token), user.id),
    )
    connection.commit()

    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="strict",
        path="/api",
    )


@router.get("/me")
def current_user(user: Annotated[User, Depends(require_user)]) -> User:
    return user


@router.post("/logout", status_code=204)
def logout(request: Request) -> Response:
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        with get_connection() as connection:
            run_sql(connection, "DELETE FROM user_sessions WHERE token_hash = ?", (hash_token(token),))
            connection.commit()

    response = Response(status_code=204)
    response.delete_cookie(SESSION_COOKIE, path="/api")
    return response
