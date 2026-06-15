const nextBtn = document.getElementById("next-btn");
const modal = document.querySelector(".custom-modal");
const closeModalBtn = document.querySelector(".close-modal");

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    modal.classList.remove("show");
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const selected = document.querySelector('input[name="answer"]:checked');
    
    if (!selected) {
      modal.classList.add("show");
      return;
    } 

    const answerId = selected.value;

    const res = await fetch("/next", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answerId }) 
    });
    
    const data = await res.json();

    if (data.finished) {
      window.location.href = "/results";
      return;
    }

    const answersContainer = document.querySelector(".answer");
    answersContainer.innerHTML = "";
    const question = document.querySelector(".question");
    if (question) {
        question.textContent = data.question.text;
        question.setAttribute("aria-live", "polite");
    }

    data.answers.forEach(a => {
        const label = document.createElement("label");
        label.className = "custom-control-label";
        label.setAttribute("for", "answer-" + a.id);
        label.innerHTML = `
            <input type="radio" class="custom-control-input" id="answer-${a.id}" name="answer" value="${a.id}">
            ${a.text}
        `;
        answersContainer.appendChild(label);
    });

    document.getElementById("score").textContent = `Pontszám: ${data.totalScore}`;
  });
}