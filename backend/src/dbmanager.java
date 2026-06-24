import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class dbmanager {
    
    private static final String URL = "jdbc:sqlite:Database/career.db";

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL);
    }

    public static void setupDatabase() {
       
        File dir = new File("Database");
        if (!dir.exists()) {
            dir.mkdirs();
        }

        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            
            
            stmt.execute("CREATE TABLE IF NOT EXISTS users (" +
                         "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                         "name TEXT, " +
                         "email TEXT UNIQUE, " +
                         "password TEXT, " +
                         "dob TEXT, " +
                         "gender TEXT, " +
                         "education TEXT, " +
                         "profile_pic TEXT)");

            
            stmt.execute("CREATE TABLE IF NOT EXISTS history (" +
                         "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                         "email TEXT, " +
                         "career_data TEXT, " +
                         "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

            System.out.println("✅ Database tables initialized successfully with profile columns.");
            
        } catch (Exception e) {
            System.err.println("❌ Database initialization failed:");
            e.printStackTrace();
        }
    }
}