from os import getenv

import mysql.connector
from fastapi import HTTPException


def get_connection():
    try:
        return mysql.connector.connect(
            host=getenv("MYSQL_HOST", "127.0.0.1"),
            port=int(getenv("MYSQL_PORT", "3306")),
            user=getenv("MYSQL_USER", "root"),
            password=getenv("MYSQL_PASSWORD", ""),
            database=getenv("MYSQL_DATABASE", "recipe_db"),
            charset="utf8mb4",
            collation="utf8mb4_general_ci",
            connection_timeout=5,
            use_pure=True,
        )
    except mysql.connector.Error as error:
        raise HTTPException(503, "The recipe database is unavailable.") from error


def run_sql(connection, sql, values=()):
    """Return query rows or the result of a write."""
    statement = connection.cmd_stmt_prepare(sql.encode())
    statement_id = statement["statement_id"]
    try:
        result = connection.cmd_stmt_execute(
            statement_id, data=values, parameters=statement["parameters"]
        )
        if isinstance(result, dict):
            return result

        columns = result[1]
        connection.unread_result = True
        rows, _ = connection.get_rows(binary=True, columns=columns)
        names = [column[0] for column in columns]
        return [dict(zip(names, row)) for row in rows]
    finally:
        connection.cmd_stmt_close(statement_id)
