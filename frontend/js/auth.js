const API_BASE_URL = "http://localhost:8080/api/auth";

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showMessage("Please fill all fields", "text-danger");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.status === "success") {
            localStorage.setItem("token", data.token);
            window.location.href = "index.html"; 
        } else {
            showMessage(data.message || "Login failed", "text-danger");
        }
    } catch (err) {
        console.error(err);
        showMessage("Server error. Is the Java backend running?", "text-danger");
    }
}


document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPass").value;
    const dob = document.getElementById("regDob").value;
    const gender = document.getElementById("regGender").value;
    const edu = document.getElementById("regEdu").value;
    const photoFile = document.getElementById("regPhoto").files[0];

    let profilePicPath = "";

   
    if (!photoFile) {
        if (gender === "male") {
            profilePicPath = "images/manavatar.png"; 
        } else if (gender === "female") {
            profilePicPath = "images/womanavatar.png"; 
        } else {
            profilePicPath = "images/defaultavatar.png"; 
        }
    } else {
       
        profilePicPath = "images/user-uploaded.png"; 
    }

    const userData = {
        name, email, password, dob, gender, education: edu, profile_pic: profilePicPath
    };

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        if (data.status === "success") {
            alert("Registration Successful!");
            window.location.href = "login.html";
        } else {
            alert("Error: " + data.message);
        }
    } catch (err) {
        console.error("Registration failed:", err);
        alert("Connection to server failed.");
    }
});

function showMessage(text, colorClass) {
    const msgDiv = document.getElementById("msg");
    if (msgDiv) {
        msgDiv.innerText = text;
        msgDiv.className = `text-center mt-3 small ${colorClass}`;
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}