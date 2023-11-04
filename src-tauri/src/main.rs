
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]



#[tauri::command]
fn get_token() -> String {
    format!("Hello, World!")
}


fn main() {
  tauri::Builder::default()
     .invoke_handler(tauri::generate_handler![get_token])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
