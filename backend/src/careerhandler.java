import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.sql.*;

public class careerhandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

       
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if ("POST".equals(exchange.getRequestMethod())) {
            String input = new String(exchange.getRequestBody().readAllBytes());
            String response;
            int statusCode;

            try {
               
                response = grokservice.getCareerPrediction(input);
                statusCode = 200;

               
            } catch (Exception e) {
                e.printStackTrace();
                response = "{\"error\": \"AI Service Unavailable\"}";
                statusCode = 500;
            }

            exchange.getResponseHeaders().add("Content-Type", "application/json");
            byte[] responseBytes = response.getBytes();
            exchange.sendResponseHeaders(statusCode, responseBytes.length);
            
            OutputStream os = exchange.getResponseBody();
            os.write(responseBytes);
            os.close();
        } else {
            exchange.sendResponseHeaders(405, -1);
        }
    }

    private void saveToHistory(String input, String aiResponse) {
        
        String email = extract(input, "email");
        
        if (email.isEmpty()) return; 

        try (Connection conn = dbmanager.getConnection()) {
            String sql = "INSERT INTO history (email, career_data) VALUES (?, ?)";
            PreparedStatement pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, email);
            pstmt.setString(2, aiResponse);
            pstmt.executeUpdate();
            System.out.println("✅ Prediction saved to history for: " + email);
        } catch (SQLException e) {
            System.out.println("❌ Failed to save history: " + e.getMessage());
        }
    }

   
    private String extract(String body, String key) {
        try {
            String pattern = "\"" + key + "\":\"";
            int start = body.indexOf(pattern);
            if (start == -1) return ""; 
            start += pattern.length();
            int end = body.indexOf("\"", start);
            return body.substring(start, end).trim();
        } catch (Exception e) {
            return "";
        }
    }
}