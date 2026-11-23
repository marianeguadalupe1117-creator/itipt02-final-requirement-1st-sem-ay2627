from io import BytesIO
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from mysql.connector import IntegrityError
from PIL import Image, ImageOps
from pydantic import BaseModel

from auth import User, require_user
from database import get_connection, run_sql

router = APIRouter(prefix="/api/posts")
MAX_IMAGE_BYTES = 5 * 1024 * 1024
IMAGE_FORMATS = ["JPEG", "PNG", "WEBP"]


class RecipePost(BaseModel):
    id: int
    author_id: int
    dish_name: str
    recipe: str
    author: str
    saved: bool = False


@router.get("", response_model=list[RecipePost])
def list_posts(user: Annotated[User, Depends(require_user)], saved: bool = False):
    with get_connection() as connection:
        return run_sql(
            connection,
            "SELECT p.postID AS id, p.userID AS author_id, p.dishName AS dish_name, "
            "p.recipe, u.name AS author, s.postID IS NOT NULL AS saved "
            "FROM post AS p JOIN users AS u ON u.userID = p.userID "
            "LEFT JOIN saved_posts AS s ON s.postID = p.postID AND s.userID = ? "
            "WHERE (? = 0 OR s.postID IS NOT NULL) ORDER BY p.postID DESC",
            (user.id, saved),
        )


def prepare_photo(image: UploadFile) -> bytes:
    if image.size is not None and image.size > MAX_IMAGE_BYTES:
        raise HTTPException(413, "Choose an image that is 5 MB or smaller.")

    try:
        with Image.open(image.file, formats=IMAGE_FORMATS) as photo:
            if photo.width * photo.height > 50_000_000:
                raise HTTPException(422, "Choose an image with smaller dimensions.")
            photo = ImageOps.exif_transpose(photo)
            photo.thumbnail((1200, 1200))
            output = BytesIO()
            photo.convert("RGB").save(output, format="JPEG", quality=80)

            # The local MariaDB server accepts packets up to 1 MB.
            if output.tell() > 400 * 1024:
                photo.thumbnail((640, 640))
                output = BytesIO()
                photo.convert("RGB").save(output, format="JPEG", quality=70)
    except (OSError, ValueError, SyntaxError, Image.DecompressionBombError) as error:
        raise HTTPException(422, "Choose a valid JPG, PNG, or WebP image.") from error
    return output.getvalue()


@router.post("", status_code=201)
def create_post(
    user: Annotated[User, Depends(require_user)],
    dish_name: Annotated[str, Form(min_length=1, max_length=100)],
    recipe: Annotated[str, Form(min_length=1, max_length=8000)],
    image: Annotated[UploadFile, File()],
) -> RecipePost:
    dish_name = dish_name.strip()
    recipe = recipe.strip()
    if not dish_name or not recipe:
        raise HTTPException(422, "Enter a dish name and recipe.")
    photo = prepare_photo(image)

    with get_connection() as connection:
        result = run_sql(
            connection,
            "INSERT INTO post (userID, dishName, recipe, image, imageType) "
            "VALUES (?, ?, ?, ?, 'image/jpeg')",
            (user.id, dish_name, recipe, photo),
        )
        connection.commit()

    return RecipePost(
        id=result["insert_id"], author_id=user.id, dish_name=dish_name, recipe=recipe, author=user.name
    )


@router.put("/{post_id}", status_code=204)
def edit_post(
    post_id: int,
    user: Annotated[User, Depends(require_user)],
    dish_name: Annotated[str, Form(min_length=1, max_length=100)],
    recipe: Annotated[str, Form(min_length=1, max_length=8000)],
    image: Annotated[UploadFile | None, File()] = None,
) -> Response:
    dish_name = dish_name.strip()
    recipe = recipe.strip()
    if not dish_name or not recipe:
        raise HTTPException(422, "Enter a dish name and recipe.")
    photo = None
    if image:
        photo = prepare_photo(image)

    with get_connection() as connection:
        posts = run_sql(
            connection,
            "SELECT postID FROM post WHERE postID = ? AND userID = ? FOR UPDATE",
            (post_id, user.id),
        )
        if not posts:
            raise HTTPException(404, "Post not found.")
        run_sql(
            connection,
            "UPDATE post SET dishName = ?, recipe = ? WHERE postID = ?",
            (dish_name, recipe, post_id),
        )
        if photo is not None:
            run_sql(
                connection,
                "UPDATE post SET image = ?, imageType = 'image/jpeg' WHERE postID = ?",
                (photo, post_id),
            )
        connection.commit()
    return Response(status_code=204)


@router.delete("/{post_id}", status_code=204)
def delete_post(post_id: int, user: Annotated[User, Depends(require_user)]) -> Response:
    with get_connection() as connection:
        result = run_sql(connection, "DELETE FROM post WHERE postID = ? AND userID = ?", (post_id, user.id))
        if result["affected_rows"] == 0:
            raise HTTPException(404, "Post not found.")
        connection.commit()
    return Response(status_code=204)


@router.put("/{post_id}/save", status_code=204)
def save_post(post_id: int, user: Annotated[User, Depends(require_user)]) -> Response:
    try:
        with get_connection() as connection:
            run_sql(
                connection,
                "INSERT INTO saved_posts (userID, postID) VALUES (?, ?) "
                "ON DUPLICATE KEY UPDATE postID = ?",
                (user.id, post_id, post_id),
            )
            connection.commit()
    except IntegrityError as error:
        if error.errno == 1452:
            raise HTTPException(404, "Post not found.") from error
        raise
    return Response(status_code=204)


@router.delete("/{post_id}/save", status_code=204)
def unsave_post(post_id: int, user: Annotated[User, Depends(require_user)]) -> Response:
    with get_connection() as connection:
        run_sql(
            connection,
            "DELETE FROM saved_posts WHERE userID = ? AND postID = ?", (user.id, post_id)
        )
        connection.commit()
    return Response(status_code=204)


@router.get("/{post_id}/image")
def post_image(post_id: int, user: Annotated[User, Depends(require_user)]) -> Response:
    with get_connection() as connection:
        photos = run_sql(connection, "SELECT image, imageType FROM post WHERE postID = ?", (post_id,))
    if not photos:
        raise HTTPException(404, "Post not found.")

    photo = photos[0]
    return Response(
        photo["image"], media_type=photo["imageType"],
        headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "no-store"},
    )
