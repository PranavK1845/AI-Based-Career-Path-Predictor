import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.sql.*;

public class authhandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        addCORS(exchange);
        
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return;
        }

        String path = exchange.getRequestURI().getPath();
        String response = "";

        try (Connection conn = dbmanager.getConnection()) {
            
            
            if (path.contains("save")) {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes(), "UTF-8");
                
                int start = body.indexOf("\"career_data\":\"") + 15;
                int end = body.lastIndexOf("\"}");
                String careerData = body.substring(start, end);

                careerData = careerData.replace("\\\"", "\"")
                                       .replace("\\\\", "\\")
                                       .replace("\\n", " ");

                PreparedStatement pstmt = conn.prepareStatement(
                    "INSERT INTO history (email, career_data) VALUES (?, ?)");
                pstmt.setString(1, extract(body, "email"));
                pstmt.setString(2, careerData);
                pstmt.executeUpdate();
                
                response = "{\"status\":\"success\"}";
            }

           
            else if (path.contains("getHistory")) {
                String token = exchange.getRequestHeaders().getFirst("Authorization");
                String email = token.replace("user_", "");

                
                PreparedStatement pstmt = conn.prepareStatement(
                    "SELECT id, career_data FROM history WHERE email=? ORDER BY timestamp DESC");
                pstmt.setString(1, email);
                ResultSet rs = pstmt.executeQuery();

                StringBuilder historyJson = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    int id = rs.getInt("id");
                    String entry = rs.getString("career_data");
                    if (entry != null && !entry.isEmpty()) {
                        if (!first) historyJson.append(",");
                      
                        historyJson.append("{\"id\":").append(id).append(",\"career_data\":").append(entry).append("}");
                        first = false;
                    }
                }
                historyJson.append("]");
                response = "{\"status\":\"success\", \"history\":" + historyJson.toString() + "}";
            }

            
            else if (path.contains("deleteHistory")) {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes(), "UTF-8");
                String email = extract(body, "email");
                String idStr = extract(body, "id"); 

                PreparedStatement pstmt = conn.prepareStatement(
                    "DELETE FROM history WHERE email=? AND id=?");
                pstmt.setString(1, email);
                pstmt.setInt(2, Integer.parseInt(idStr)); 
                
                int rowsAffected = pstmt.executeUpdate();
                response = "{\"status\":\"success\", \"rows\":" + rowsAffected + "}";
            }
            
          
            else if (path.contains("getProfile")) {
                String token = exchange.getRequestHeaders().getFirst("Authorization");
                if (token != null && token.startsWith("user_")) {
                    String email = token.replace("user_", "");
                    PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM users WHERE email=?");
                    pstmt.setString(1, email);
                    ResultSet rs = pstmt.executeQuery();
                    if (rs.next()) {
                        response = "{" +
                            "\"status\":\"success\"," +
                            "\"name\":\"" + rs.getString("name") + "\"," +
                            "\"email\":\"" + rs.getString("email") + "\"," +
                            "\"dob\":\"" + rs.getString("dob") + "\"," +
                            "\"gender\":\"" + rs.getString("gender") + "\"," +
                            "\"education\":\"" + rs.getString("education") + "\"," +
                            "\"profile_pic\":\"" + rs.getString("profile_pic") + "\"" +
                            "}";
                    }
                }
            } else {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes(), "UTF-8");
                String email = extract(body, "email");
                String pass = extract(body, "password");

                if (path.contains("register")) {
                    String name = extract(body, "name");
                    String dob = extract(body, "dob");
                    String gender = extract(body, "gender");
                    String education = extract(body, "education");
                    String profilePic = extract(body, "profile_pic");

                    PreparedStatement pstmt = conn.prepareStatement(
                        "INSERT INTO users (name, email, password, dob, gender, education, profile_pic) VALUES (?, ?, ?, ?, ?, ?, ?)"
                    );
                    pstmt.setString(1, name);
                    pstmt.setString(2, email);
                    pstmt.setString(3, pass);
                    pstmt.setString(4, dob);
                    pstmt.setString(5, gender);
                    pstmt.setString(6, education);
                    pstmt.setString(7, profilePic);
                    pstmt.executeUpdate();
                    response = "{\"status\":\"success\"}";
                } else {
                    PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM users WHERE email=? AND password=?");
                    pstmt.setString(1, email);
                    pstmt.setString(2, pass);
                    ResultSet rs = pstmt.executeQuery();
                    if (rs.next()) {
                        response = "{\"status\":\"success\", \"token\":\"user_" + email + "\"}";
                    } else {
                        response = "{\"status\":\"error\", \"message\":\"Invalid credentials\"}";
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            response = "{\"status\":\"error\", \"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
        }

        exchange.getResponseHeaders().add("Content-Type", "application/json");
        byte[] responseBytes = response.getBytes("UTF-8");
        exchange.sendResponseHeaders(200, responseBytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(responseBytes);
        os.close();
    }

    private void addCORS(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private String extract(String body, String key) {
        try {
            
            String pattern = "\"" + key + "\":";
            int start = body.indexOf(pattern);
            if (start == -1) return ""; 
            start += pattern.length();
            
          
            if (body.charAt(start) == '\"') {
                start++;
                int end = body.indexOf("\"", start);
                return body.substring(start, end).trim();
            } else {
               
                int endComma = body.indexOf(",", start);
                int endBracket = body.indexOf("}", start);
                int end = (endComma != -1 && endComma < endBracket) ? endComma : endBracket;
                return body.substring(start, end).trim();
            }
        } catch (Exception e) { return ""; }
    }
}