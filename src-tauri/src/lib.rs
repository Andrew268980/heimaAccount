use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Expense {
    pub id: Option<i64>,
    pub amount: f64,
    pub category_level1: String,
    pub category_level2: String,
    pub date: String,
    pub note: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddExpenseRequest {
    pub amount: f64,
    pub category_level1: String,
    pub category_level2: String,
    pub date: String,
    pub note: String,
}

type DbPool = sqlx::SqlitePool;

#[tauri::command]
async fn add_expense(
    pool: tauri::State<'_, DbPool>,
    expense: AddExpenseRequest,
) -> Result<Expense, String> {
    let result = sqlx::query(
        "INSERT INTO expenses (amount, category_level1, category_level2, date, note) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(expense.amount)
    .bind(&expense.category_level1)
    .bind(&expense.category_level2)
    .bind(&expense.date)
    .bind(&expense.note)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(Expense {
        id: Some(result.last_insert_rowid()),
        amount: expense.amount,
        category_level1: expense.category_level1,
        category_level2: expense.category_level2,
        date: expense.date,
        note: expense.note,
        created_at: None,
    })
}

#[tauri::command]
async fn get_expenses(pool: tauri::State<'_, DbPool>) -> Result<Vec<Expense>, String> {
    let expenses = sqlx::query_as::<_, Expense>(
        "SELECT id, amount, category_level1, category_level2, date, note, created_at FROM expenses ORDER BY date DESC, id DESC"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(expenses)
}

#[tauri::command]
async fn delete_expense(pool: tauri::State<'_, DbPool>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM expenses WHERE id = ?")
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn update_expense(
    pool: tauri::State<'_, DbPool>,
    id: i64,
    expense: AddExpenseRequest,
) -> Result<(), String> {
    sqlx::query(
        "UPDATE expenses SET amount = ?, category_level1 = ?, category_level2 = ?, date = ?, note = ? WHERE id = ?"
    )
    .bind(expense.amount)
    .bind(&expense.category_level1)
    .bind(&expense.category_level2)
    .bind(&expense.date)
    .bind(&expense.note)
    .bind(id)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // The sql plugin stores the pool in a way we can access.
            // We need to create our own pool reference for state management.
            // Get the app's data dir and connect directly
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("should have app data dir");
            std::fs::create_dir_all(&app_dir).ok();

            let db_path = app_dir.join("heima.db");
            let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

            // We'll use tauri async runtime to block on this
            let pool = tauri::async_runtime::block_on(async {
                sqlx::SqlitePool::connect(&db_url)
                    .await
                    .expect("failed to connect to database")
            });

            // Run migrations manually
            tauri::async_runtime::block_on(async {
                sqlx::query(
                    "CREATE TABLE IF NOT EXISTS expenses (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        amount REAL NOT NULL,
                        category_level1 TEXT NOT NULL,
                        category_level2 TEXT NOT NULL,
                        date TEXT NOT NULL,
                        note TEXT NOT NULL DEFAULT '',
                        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
                    );"
                )
                .execute(&pool)
                .await
                .expect("failed to create expenses table")
            });

            app.manage(pool);

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            add_expense,
            get_expenses,
            delete_expense,
            update_expense,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
