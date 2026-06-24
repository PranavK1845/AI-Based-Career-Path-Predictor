let currentCareerData = []; 

async function predict() {
    const skills = document.getElementById("skills").value.trim();
    const edu = document.getElementById("education").value.trim();
    const interests = document.getElementById("interests").value.trim();
    const exp = document.getElementById("experience").value.trim();

    if (!skills || !edu) {
        alert("Please enter at least Skills and Education!");
        return;
    }

    const loadingEl = document.getElementById("loading");
    const resultsDiv = document.getElementById("results");
    
    
    if(loadingEl) loadingEl.classList.remove("d-none");
    resultsDiv.innerHTML = "";

    try {
        const data = await fetchCareerPrediction({ skills, education: edu, interests, experience: exp });
        
    
        if(loadingEl) loadingEl.classList.add("d-none");

        if (data && data.careers) {
           
            window.lastAiResult = data;
            currentCareerData = data.careers;
            
            
            displayJobTitles(data.careers);
            
          
            resultsDiv.innerHTML += `
                <div class="col-12 mt-2 mb-5">
                    <div class="card border-0 bg-white shadow-sm p-4 text-center">
                        <div class="d-flex align-items-center justify-content-center mb-2">
                            <hr class="flex-grow-1 m-0" style="opacity: 0.1;">
                            <span class="mx-3 text-muted small fw-bold text-uppercase" style="letter-spacing: 1px;">Storage</span>
                            <hr class="flex-grow-1 m-0" style="opacity: 0.1;">
                        </div>
                        <p class="text-secondary mb-3">Would you like to keep these 4 career paths in your profile?</p>
                        <button class="btn btn-success btn-lg px-5 shadow-sm fw-bold" onclick="saveToProfile(this)" style="border-radius: 50px;">
                            <i class="fas fa-cloud-upload-alt me-2"></i> Save All Roadmaps
                        </button>
                        <small class="text-muted d-block mt-2">You can access these anytime from your "My Profile" page.</small>
                    </div>
                </div>`;
        }
    } catch (error) {
       
        if(loadingEl) loadingEl.classList.add("d-none");
        console.error("Prediction Error:", error);
        resultsDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function displayJobTitles(careers) {
    const resultsDiv = document.getElementById("results");
    
    resultsDiv.className = "row mt-5 justify-content-center"; 
    resultsDiv.innerHTML = ""; 

    careers.forEach((job, index) => {
        resultsDiv.innerHTML += `
            <div class="col-md-6 mb-4">
                <div class="card career-card h-100 shadow-sm border-0 text-center p-4" onclick="showRoadmap(${index})">
                    <div class="card-body">
                        <div class="mb-3 text-primary"><i class="fas fa-rocket fa-2x"></i></div>
                        <h5 class="fw-bold mb-0">${job.title}</h5>
                        <p class="text-muted small mt-2 mb-0">Explore Roadmap & Quiz</p>
                    </div>
                </div>
            </div>`;
    });
}

function showRoadmap(index) {
    const job = currentCareerData[index];
    if (!job) return;

    document.getElementById("modalJobTitle").innerText = job.title || job.job_role || "Career Path";
    
    const jobDesc = job.description || job.desc || job.about || "Information currently unavailable.";
    document.getElementById("modalDescText").innerText = jobDesc;

    const stepsDiv = document.getElementById("roadmapSteps");
    stepsDiv.innerHTML = "";

    const roadmapData = job.roadmap || job.steps || job.path || job.career_path;

    if (roadmapData && Array.isArray(roadmapData)) {
        roadmapData.forEach(step => {
            const sTitle = step.title || step.name || "Step";
            const sDetails = step.details || step.description || "";
            
            stepsDiv.innerHTML += `
                <div class="roadmap-step mb-3 border-start border-primary ps-3" style="border-width: 3px !important;">
                    <h6 class="fw-bold mb-1">${sTitle}</h6>
                    <p class="small text-muted mb-0">${sDetails}</p>
                </div>`;
        });
    } else {
        stepsDiv.innerHTML = "<p class='text-muted small'>Roadmap details are being updated. Please try again.</p>";
    }

    const quizModalEl = document.getElementById("quizModal");
    if (quizModalEl) {
        quizModalEl.setAttribute("data-job-index", index);
    }

    const roadmapModalEl = document.getElementById('roadmapModal');
    const roadmapModal = new bootstrap.Modal(roadmapModalEl);
    roadmapModal.show();
}

function openQuiz() {
    const quizModalEl = document.getElementById("quizModal");
    const index = quizModalEl.getAttribute("data-job-index");
    const job = currentCareerData[index];
    const container = document.getElementById("quizContainer");

    const roadmapModalEl = document.getElementById('roadmapModal');
    const roadmapInstance = bootstrap.Modal.getInstance(roadmapModalEl);
    if (roadmapInstance) roadmapInstance.hide();

    if (!job.quiz || job.quiz.length === 0) {
        alert("No quiz available for this role yet.");
        return;
    }

    container.innerHTML = `<h5 class="mb-4 text-center text-primary">Assessment: ${job.title}</h5>`;
    job.quiz.forEach((q, qIndex) => {
        container.innerHTML += `
            <div class="quiz-question mb-4 p-3 bg-white border rounded shadow-sm">
                <p class="fw-bold mb-2">${qIndex + 1}. ${q.question}</p>
                ${q.options.map((opt, i) => `
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="q${qIndex}" id="q${qIndex}_${i}" value="${i}">
                        <label class="form-check-label small" for="q${qIndex}_${i}">${opt}</label>
                    </div>`).join('')}
            </div>`;
    });

    const quizFooter = document.getElementById("quizFooter");
    if(quizFooter) quizFooter.classList.remove("d-none");
    
    const quizModal = new bootstrap.Modal(quizModalEl);
    quizModal.show();
}

function submitQuiz() {
    const quizModalEl = document.getElementById("quizModal");
    const index = quizModalEl.getAttribute("data-job-index");
    const job = currentCareerData[index];
    let score = 0;

    job.quiz.forEach((q, qIndex) => {
        const selected = document.querySelector(`input[name="q${qIndex}"]:checked`);
        if (selected && parseInt(selected.value) === q.correctAnswer) {
            score++;
        }
    });

    const percent = (score / job.quiz.length) * 100;
    let feedbackClass = percent >= 80 ? 'alert-success' : (percent >= 50 ? 'alert-warning' : 'alert-danger');
    let statusIcon = percent >= 80 ? '🔥' : (percent >= 50 ? '⚡' : '📚');

    document.getElementById("quizContainer").innerHTML = `
        <div class="text-center py-4">
            <h2 class="fw-bold">Your Score: ${score} / ${job.quiz.length}</h2>
            <div class="alert ${feedbackClass} mt-4 text-start">
                <h6 class="fw-bold">${statusIcon} Feedback:</h6>
                <p class="small mb-2">${percent >= 80 ? 'Excellent! You have a strong grasp of the requirements.' : 'You have the basics, but there is room to grow.'}</p>
                <hr>
                <p class="mb-0 small"><strong>Suggested Improvements:</strong> ${job.improvements || "Focus on the roadmap steps provided."}</p>
            </div>
            <button class="btn btn-primary mt-3" data-bs-dismiss="modal">Back to Dashboard</button>
        </div>`;

    const quizFooter = document.getElementById("quizFooter");
    if(quizFooter) quizFooter.classList.add("d-none");
}