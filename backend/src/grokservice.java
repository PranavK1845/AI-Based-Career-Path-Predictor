import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class grokservice {
   
    private static final String API_KEY = "APi KEy";

  public static String getCareerPrediction(String userInput) throws Exception {
    URL url = new URL("https://api.groq.com/openai/v1/chat/completions");
    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
    conn.setRequestMethod("POST");
    conn.setRequestProperty("Authorization", "Bearer " + API_KEY);
    conn.setRequestProperty("Content-Type", "application/json");
    conn.setDoOutput(true);

    
    String prompt = "Return ONLY a valid JSON object. No conversational text. " +
        "Based on the user profile, generate exactly 4 different career paths. " +
        "For EACH career path, you MUST include exactly 5 multiple-choice questions in the quiz array. " +
        "The JSON structure MUST be: " +
        "{" +
        "  \"careers\": [" +
        "    {" +
        "      \"title\": \"Job Title\"," +
        "      \"description\": \"...\"," +
        "      \"roadmap\": [ {\"title\": \"Step\", \"details\": \"...\"} ]," +
        "      \"quiz\": [ {\"question\": \"...\", \"options\": [\"A\",\"B\",\"C\",\"D\"], \"correctAnswer\": 0} ]," +
        "      \"improvements\": \"...\"" +
        "    }" +
        "  ]" +
        "}. " +
        "User Profile: " + userInput;
    
   
    String jsonInput = "{" +
        "\"model\": \"llama-3.3-70b-versatile\", " +
        "\"messages\": [{\"role\": \"user\", \"content\": \"" + prompt.replace("\"", "\\\"") + "\"}], " +
        "\"temperature\": 0.3, " +
        "\"max_tokens\": 3000" + 
        "}";

    try (OutputStream os = conn.getOutputStream()) {
        os.write(jsonInput.getBytes(StandardCharsets.UTF_8));
    }

    return new String(conn.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
}}