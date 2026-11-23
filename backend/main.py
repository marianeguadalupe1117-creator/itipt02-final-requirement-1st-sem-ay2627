from typing import Annotated, Literal

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mysql.connector import IntegrityError
from pydantic import BaseModel, Field, StringConstraints

from auth import User, require_user, router as auth_router, session_user
from database import get_connection, run_sql
from posts import router as posts_router

app = FastAPI(title="PrepMaster API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://localhost:8100",
        "http://localhost:8102",
        "http://127.0.0.1:4200",
        "http://127.0.0.1:8100",
        "http://127.0.0.1:8102",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)
app.include_router(auth_router)
app.include_router(posts_router)


@app.exception_handler(RequestValidationError)
async def invalid_request(request: Request, error: RequestValidationError):
    if request.url.path.startswith("/api/auth/"):
        return JSONResponse(
            {"detail": "Enter a valid email and a password of 8 to 48 characters."},
            status_code=422,
        )
    return await request_validation_exception_handler(request, error)


CATEGORY_SLUGS = {
    "Main Dish": "main-dish",
    "Soup": "soup",
    "Pasta/Noodles": "noodles",
    "Grilled/Roasted": "roated-grilled",
    "Snacks/Dessert": "merienda",
    "Fried": "fried",
}

RECIPE_SELECT = """
    SELECT d.dishID AS id, d.dishName AS name, d.dcategoryID AS category_id,
           c.dcategoryName AS category_name, d.dishImage AS image_url
    FROM dish AS d
    JOIN dishcategory AS c ON c.dcategoryID = d.dcategoryID
"""

INGREDIENT_NEEDS_SELECT = """
    SELECT n.dishID AS dish_id, n.ingredientID AS ingredient_id, i.ingredientName AS name,
           n.quantity, n.unit
    FROM ingredientneeds AS n
    JOIN ingredients AS i ON i.ingredientID = n.ingredientID
"""


class RecipeSearchRequest(BaseModel):
    category: Literal[
        "main-dish", "soup", "noodles", "rice", "fried", "roated-grilled", "merienda"
    ] | None = None
    q: str = ""


class RecipeWriteRequest(BaseModel):
    name: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
    ]
    category_id: int = Field(gt=0)
    image_url: str = Field(default="", max_length=255)


class Recipe(BaseModel):
    id: int
    name: str
    category: str
    category_id: int
    image_url: str


class RecipeSearchResponse(BaseModel):
    recipes: list[Recipe]


class DishListItem(BaseModel):
    id: int
    name: str


class DishCategory(DishListItem):
    image: str | None


class SavedDish(DishListItem):
    image_url: str


class CategoryDishes(BaseModel):
    category: DishCategory
    dishes: list[DishListItem]


class CookingStep(BaseModel):
    id: int
    number: int
    text: str


class IngredientNeed(BaseModel):
    ingredient_id: int
    name: str
    quantity: str
    unit: str


class IngredientCategory(DishListItem):
    ingredients: list[DishListItem]


class RecipeIngredients(DishListItem):
    ingredients: list[IngredientNeed]


class IngredientsResponse(BaseModel):
    categories: list[IngredientCategory]
    recipes: list[RecipeIngredients]


class DishDetails(BaseModel):
    name: str
    category_id: int
    image_url: str
    saved: bool
    ingredients: list[IngredientNeed]
    steps: list[CookingStep]


def to_recipe(row: dict) -> Recipe:
    category_name = row["category_name"]
    category = CATEGORY_SLUGS.get(category_name, category_name.lower().replace(" ", "-"))
    return Recipe(category=category, **row)


def find_recipe(connection, recipe_id: int) -> Recipe:
    rows = run_sql(connection, RECIPE_SELECT + " WHERE d.dishID = ?", (recipe_id,))
    if not rows:
        raise HTTPException(404, "Recipe not found.")
    return to_recipe(rows[0])


def ingredient_need(row: dict) -> IngredientNeed:
    return IngredientNeed(
        ingredient_id=row["ingredient_id"],
        name=row["name"].strip(),
        quantity=row["quantity"].strip(),
        unit=row["unit"].strip(),
    )


@app.get("/api/ingredients", response_model=IngredientsResponse)
def get_ingredients():
    with get_connection() as connection:
        categories = run_sql(
            connection,
            "SELECT icategoryID AS id, icategoryName AS name FROM icategory ORDER BY icategoryID",
        )
        ingredients = run_sql(
            connection,
            "SELECT ingredientID AS id, ingredientName AS name, icategoryID AS category_id "
            "FROM ingredients ORDER BY ingredientID",
        )
        recipes = run_sql(connection, "SELECT dishID AS id, dishName AS name FROM dish ORDER BY dishID")
        needs = run_sql(
            connection,
            INGREDIENT_NEEDS_SELECT + " ORDER BY n.dishID, n.ingredientID, n.quantity, n.unit",
        )

    ingredients_by_category = {}
    for category in categories:
        category["name"] = category["name"].strip()
        category["ingredients"] = []
        ingredients_by_category[category["id"]] = category["ingredients"]

    for ingredient in ingredients:
        ingredient["name"] = ingredient["name"].strip()
        ingredients_by_category[ingredient["category_id"]].append(ingredient)

    ingredients_by_recipe = {}
    for recipe in recipes:
        recipe["name"] = recipe["name"].strip()
        recipe["ingredients"] = []
        ingredients_by_recipe[recipe["id"]] = recipe["ingredients"]

    for need in needs:
        ingredients_by_recipe[need["dish_id"]].append(ingredient_need(need))

    return {"categories": categories, "recipes": recipes}


@app.get("/api/dish-categories", response_model=list[DishCategory])
def list_dish_categories():
    with get_connection() as connection:
        return run_sql(
            connection,
            "SELECT dcategoryID AS id, TRIM(dcategoryName) AS name, image "
            "FROM dishcategory ORDER BY dcategoryID",
        )


@app.get("/api/dish-categories/{category_id}/dishes", response_model=CategoryDishes)
def list_category_dishes(category_id: int):
    with get_connection() as connection:
        categories = run_sql(
            connection,
            "SELECT dcategoryID AS id, TRIM(dcategoryName) AS name, image "
            "FROM dishcategory WHERE dcategoryID = ?",
            (category_id,),
        )
        if not categories:
            raise HTTPException(404, "Dish category not found.")

        dishes = run_sql(
            connection,
            "SELECT dishID AS id, TRIM(dishName) AS name "
            "FROM dish WHERE dcategoryID = ? ORDER BY dishID",
            (category_id,),
        )

    return {"category": categories[0], "dishes": dishes}


@app.get("/api/dishes/{dish_id}")
def get_dish_details(dish_id: int, user: Annotated[User | None, Depends(session_user)]) -> DishDetails:
    user_id = user.id if user else None
    with get_connection() as connection:
        dishes = run_sql(
            connection,
            "SELECT d.dishName, d.dcategoryID, d.dishImage, "
            "s.dishID IS NOT NULL AS saved FROM dish AS d "
            "LEFT JOIN user_saved_dishes AS s ON s.dishID = d.dishID AND s.userID = ? "
            "WHERE d.dishID = ?",
            (user_id, dish_id),
        )
        if not dishes:
            raise HTTPException(404, "Dish not found.")
        dish = dishes[0]

        needs = run_sql(
            connection,
            INGREDIENT_NEEDS_SELECT + " WHERE n.dishID = ? ORDER BY n.ingredientID",
            (dish_id,),
        )

        steps = run_sql(
            connection,
            "SELECT instructionID AS id, stepNumber AS number, instruction AS text "
            "FROM instruction WHERE dishID = ? ORDER BY stepNumber, instructionID",
            (dish_id,),
        )

    ingredients = []
    for need in needs:
        ingredients.append(ingredient_need(need))
    for step in steps:
        step["text"] = step["text"].strip()

    return DishDetails(
        name=dish["dishName"].strip(),
        category_id=dish["dcategoryID"],
        image_url=dish["dishImage"].strip(),
        saved=bool(dish["saved"]),
        ingredients=ingredients,
        steps=steps,
    )


@app.get("/api/saved-dishes", response_model=list[SavedDish])
def list_saved_dishes(user: Annotated[User, Depends(require_user)]):
    with get_connection() as connection:
        return run_sql(
            connection,
            "SELECT d.dishID AS id, TRIM(d.dishName) AS name, TRIM(d.dishImage) AS image_url "
            "FROM user_saved_dishes AS s JOIN dish AS d ON d.dishID = s.dishID "
            "WHERE s.userID = ? ORDER BY d.dishName, d.dishID",
            (user.id,),
        )


@app.put("/api/saved-dishes/{dish_id}", status_code=204)
def save_dish(dish_id: int, user: Annotated[User, Depends(require_user)]) -> Response:
    try:
        with get_connection() as connection:
            run_sql(
                connection,
                "INSERT INTO user_saved_dishes (userID, dishID) VALUES (?, ?) "
                "ON DUPLICATE KEY UPDATE dishID = ?",
                (user.id, dish_id, dish_id),
            )
            connection.commit()
    except IntegrityError as error:
        if error.errno == 1452:
            raise HTTPException(404, "Dish not found.") from error
        raise
    return Response(status_code=204)


@app.delete("/api/saved-dishes/{dish_id}", status_code=204)
def unsave_dish(dish_id: int, user: Annotated[User, Depends(require_user)]) -> Response:
    with get_connection() as connection:
        run_sql(
            connection,
            "DELETE FROM user_saved_dishes WHERE userID = ? AND dishID = ?",
            (user.id, dish_id),
        )
        connection.commit()
    return Response(status_code=204)


@app.get("/recipes")
def search_recipes(
    request: Annotated[RecipeSearchRequest, Query()],
) -> RecipeSearchResponse:
    search_term = request.q.strip().casefold()
    with get_connection() as connection:
        rows = run_sql(connection, RECIPE_SELECT + " ORDER BY d.dishID")

    recipes = []
    for row in rows:
        recipe = to_recipe(row)
        if request.category and recipe.category != request.category:
            continue
        if search_term in recipe.name.casefold():
            recipes.append(recipe)
    return RecipeSearchResponse(recipes=recipes)


@app.get("/recipes/{recipe_id}")
def get_recipe(recipe_id: int) -> Recipe:
    with get_connection() as connection:
        return find_recipe(connection, recipe_id)


@app.post("/recipes", status_code=201)
def create_recipe(request: RecipeWriteRequest) -> Recipe:
    try:
        with get_connection() as connection:
            result = run_sql(
                connection,
                "INSERT INTO dish (dishName, dcategoryID, dishImage) VALUES (?, ?, ?)",
                (request.name, request.category_id, request.image_url),
            )
            recipe = find_recipe(connection, result["insert_id"])
            connection.commit()
            return recipe
    except IntegrityError as error:
        if error.errno == 1452:
            raise HTTPException(422, "Recipe category does not exist.") from error
        raise


@app.put("/recipes/{recipe_id}")
def update_recipe(recipe_id: int, request: RecipeWriteRequest) -> Recipe:
    try:
        with get_connection() as connection:
            run_sql(
                connection,
                "UPDATE dish SET dishName = ?, dcategoryID = ?, dishImage = ? WHERE dishID = ?",
                (request.name, request.category_id, request.image_url, recipe_id),
            )
            recipe = find_recipe(connection, recipe_id)
            connection.commit()
            return recipe
    except IntegrityError as error:
        if error.errno == 1452:
            raise HTTPException(422, "Recipe category does not exist.") from error
        raise


@app.delete("/recipes/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: int) -> Response:
    try:
        with get_connection() as connection:
            dishes = run_sql(connection, "SELECT dishID FROM dish WHERE dishID = ? FOR UPDATE", (recipe_id,))
            if not dishes:
                raise HTTPException(404, "Recipe not found.")

            run_sql(connection, "DELETE FROM ingredientneeds WHERE dishID = ?", (recipe_id,))
            run_sql(connection, "DELETE FROM instruction WHERE dishID = ?", (recipe_id,))
            run_sql(connection, "DELETE FROM dish WHERE dishID = ?", (recipe_id,))
            connection.commit()
    except IntegrityError as error:
        if error.errno == 1451:
            raise HTTPException(409, "This recipe is still referenced by a meal plan.") from error
        raise

    return Response(status_code=204)
