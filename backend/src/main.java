import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;

public class main {
    public static void main(String[] args) throws Exception {
        
        dbmanager.setupDatabase();

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        
        
        server.createContext("/api/auth", new authhandler()); 
        server.createContext("/api/career", new careerhandler());
        server.createContext("/api/auth/deleteHistory", new authhandler()); 

        server.setExecutor(null); 
        server.start();
        System.out.println("🚀 Modular Server started at http://localhost:8080");
    }
}