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

    document.querySelector(".question > p").textContent = data.question.text;

    const answersContainer = document.querySelector(".answer");
    answersContainer.innerHTML = "";
    data.answers.forEach(a => {
      const label = document.createElement("label");
      label.innerHTML = `
        <input type="radio" name="answer" value="${a.id}">
        ${a.text}
      `;
      answersContainer.appendChild(label);
    });

    document.getElementById("score").textContent = `Pontszám: ${data.totalScore}`;
  });
}