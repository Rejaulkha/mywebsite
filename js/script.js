document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (!menuToggle || !mainNav) {
    console.error("Menu button or navigation not found!");
    return;
  }

  menuToggle.addEventListener("click", function () {
    const isOpen = mainNav.classList.toggle("active");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );

    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mainNav.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      menuToggle.textContent = "☰";
    });
  });

  console.log("Mobile menu initialized successfully!");
});
const micBtn = document.getElementById("micBtn");

if (micBtn) {
  micBtn.addEventListener("click", function () {
    if (!("speechSynthesis" in window)) {
      alert("Your browser does not support voice.");
      return;
    }

    window.speechSynthesis.cancel();

    const message = new SpeechSynthesisUtterance(
      "Welcome, Rejaul! How can I help you today?"
    );

    message.lang = "en-IN";
    message.rate = 0.9;
    message.pitch = 1;

    window.speechSynthesis.speak(message);
  });
}
