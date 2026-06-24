const API_PREDICT_URL = "http://localhost:8080/api/career/predict";
const API_SAVE_URL = "http://localhost:8080/api/auth/save";


window.lastAiResult = null;

async function fetchCareerPrediction(userData) {
    try {
        const res = await fetch(API_PREDICT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        const fullData = await res.json();
        window.lastAiResult = fullData;

        let content = fullData.choices[0].message.content;

        
        let cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();

      
        cleanJson = cleanJson.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");

        try {
            return JSON.parse(cleanJson);
        } catch (parseError) {
            console.error("JSON Cleaned but still failed:", cleanJson);
            throw new Error("AI returned a messy response. Please try clicking Generate again.");
        }
        
    } catch (err) {
        console.error("Fetch Error:", err);
        throw err;
    }
}

async function saveToProfile(button) {
    
    if (!window.lastAiResult || !window.lastAiResult.careers) {
        alert("Error: No career data found to save. Please regenerate.");
        return;
    }

    const token = localStorage.getItem("token");
    
   
    let email = localStorage.getItem("userEmail");
    if (!email && token) {
        email = token.replace("user_", ""); 
    }

    if (!email) {
        alert("User session not found. Please log in again.");
        window.location.href = "login.html";
        return;
    }

   
    button.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Saving...`;
    button.disabled = true;

    try {
        const careers = window.lastAiResult.careers;

       
        const savePromises = careers.map(career => {
            return fetch("http://localhost:8080/api/auth/saveHistory", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": token 
                },
                body: JSON.stringify({
                    email: email,
                   
                    career_data: JSON.stringify(career) 
                })
            });
        });

        const results = await Promise.all(savePromises);

       
        if (results.every(res => res.ok)) {
            button.innerHTML = `<i class="fas fa-check-circle"></i> Saved Successfully!`;
            button.className = "btn btn-outline-success btn-lg px-5 shadow-sm fw-bold";
            
            
            if(confirm("All 4 roadmaps saved! View them in your profile?")) {
                window.location.href = "profile.html";
            }
        } else {
            throw new Error("Server rejected one or more saves.");
        }
    } catch (err) {
        console.error("Save error:", err);
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-cloud-upload-alt me-2"></i> Save All Roadmaps`;
        alert("Failed to save. Check if your database column 'career_data' is set to LONGTEXT.");
    }
}