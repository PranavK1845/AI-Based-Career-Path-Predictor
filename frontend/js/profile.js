let isDeleteMode = false;
let savedCareerData = []; 

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "login.html"; return; }

    const clearBtn = document.getElementById("clearBtn");
    if (clearBtn) { clearBtn.addEventListener("click", toggleDeleteMode); }

    try {
        const response = await fetch("http://localhost:8080/api/auth/getProfile", {
            headers: { "Authorization": token }
        });
        const data = await response.json();

        if (data.status === "success") {
            document.getElementById("userEmail").innerText = data.email;
            document.getElementById("userName").innerText = data.name || "User";
            document.getElementById("userEducation").innerText = data.education || "Student";

            const userInitial = document.getElementById("userInitial");
            if (data.profile_pic) {
                userInitial.innerHTML = `<img src="${data.profile_pic}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                userInitial.style.background = "transparent";
            } else {
                userInitial.innerText = (data.name || data.email).charAt(0).toUpperCase();
            }
            loadHistory(token);
        } else {
            logout();
        }
    } catch (error) { console.error("Profile load error:", error); }
});

function toggleDeleteMode() {
    isDeleteMode = !isDeleteMode;
    const btn = document.getElementById("clearBtn");
    const checkboxes = document.querySelectorAll(".delete-check");
    const cards = document.querySelectorAll(".career-card");

    if (isDeleteMode) {
        btn.innerText = "Confirm Delete Selected";
        btn.className = "btn btn-danger btn-sm w-100 mt-2";
        checkboxes.forEach(cb => cb.classList.remove("d-none"));
    } else {
        processDeletion();
    }
}

async function loadHistory(token) {
    const list = document.getElementById("historyList");
    try {
        const res = await fetch("http://localhost:8080/api/auth/getHistory", {
            headers: { "Authorization": token }
        });
        const data = await res.json();
        
        if (data.status === "success" && data.history) {
            list.innerHTML = "";
            savedCareerData = [];

            if (data.history.length === 0) {
                list.innerHTML = `<p class="text-center text-muted py-4">No saved roadmaps yet.</p>`;
                return;
            }

            data.history.forEach((item, index) => {
                
                let c = item.career_data;
                savedCareerData.push(c);

                list.innerHTML += `
                    <div class="col-md-6 mb-4">
                        <div class="card career-card h-100 shadow-sm border-0 p-3" onclick="handleCardClick(event, ${index})" style="cursor: pointer;">
                            <div class="d-flex align-items-start">
                                <input type="checkbox" class="delete-check d-none me-2 form-check-input" data-id="${item.id}" onclick="event.stopPropagation()">
                                <div class="flex-grow-1">
                                    <h6 class="fw-bold mb-1 text-primary">${c.title}</h6>
                                    <p class="mb-0 text-muted extra-small">Click to view roadmap</p>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
        }
    } catch (err) { console.error("History error:", err); }
}

function handleCardClick(event, index) {
    if (isDeleteMode) {
        const cb = event.currentTarget.querySelector(".delete-check");
        cb.checked = !cb.checked;
        event.currentTarget.classList.toggle("bg-light", cb.checked);
    } else {
        showSavedRoadmap(index);
    }
}

function showSavedRoadmap(index) {
    const job = savedCareerData[index];
    document.getElementById("modalJobTitle").innerText = job.title;
    document.getElementById("modalDescText").innerText = job.description || "";
    
    const stepsDiv = document.getElementById("roadmapSteps");
    stepsDiv.innerHTML = "";
    job.roadmap.forEach(step => {
        stepsDiv.innerHTML += `
            <div class="roadmap-step">
                <h6 class="fw-bold mb-1">${step.title}</h6>
                <p class="small text-muted mb-0">${step.details || ""}</p>
            </div>`;
    });

    document.getElementById("quizModal").setAttribute("data-index", index);
    new bootstrap.Modal(document.getElementById('roadmapModal')).show();
}

function openQuiz() {
    const index = document.getElementById("quizModal").getAttribute("data-index");
    const job = savedCareerData[index];
    const container = document.getElementById("quizContainer");

    bootstrap.Modal.getInstance(document.getElementById('roadmapModal')).hide();
    
    container.innerHTML = `<h5 class="mb-4 text-primary">${job.title} Quiz</h5>`;
    job.quiz.forEach((q, i) => {
        container.innerHTML += `
            <div class="mb-3 p-2 bg-light rounded">
                <p class="fw-bold small mb-2">${i+1}. ${q.question}</p>
                ${q.options.map((opt, oi) => `
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="q${i}" value="${oi}">
                        <label class="form-check-label small">${opt}</label>
                    </div>`).join('')}
            </div>`;
    });

    new bootstrap.Modal(document.getElementById('quizModal')).show();
}

function submitQuiz() {
    alert("Assessment submitted! Great job practicing.");
    bootstrap.Modal.getInstance(document.getElementById('quizModal')).hide();
}

async function processDeletion() {
    const selected = document.querySelectorAll(".delete-check:checked");
    if (selected.length === 0) { location.reload(); return; }

    if (!confirm(`Delete ${selected.length} items?`)) return;

    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail") || token.replace("user_", "");

    const promises = Array.from(selected).map(cb => {
        return fetch("http://localhost:8080/api/auth/deleteHistory", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": token },
            body: JSON.stringify({ email: email, id: cb.getAttribute("data-id") })
        });
    });

    await Promise.all(promises);
    location.reload();
}