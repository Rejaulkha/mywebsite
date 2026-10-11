/* REJAUL BILINGUAL VOICE ASSISTANT */
(() => {
  "use strict";

  const BACKEND_URL =
    "https://mywebsite-0eok.onrender.com/api/assistant";

  const byId = (id) => document.getElementById(id);

  const panel =
    byId("assistantPanel") || byId("voiceAssistantPanel");
  const toggle =
    byId("assistantToggle") || byId("voiceAssistantButton");
  const closeBtn =
    byId("assistantClose") || byId("closeAssistant");
  const input =
    byId("assistantInput") || byId("voiceInput");
  const sendBtn =
    byId("assistantSend") || byId("sendAssistant");
  const micBtn =
    byId("assistantMic") || byId("speakButton") ||
    byId("voiceButton");
  const messages =
    byId("assistantMessages") || byId("chatMessages");
  const status =
    byId("voiceStatus") || byId("assistantStatus");

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function openPanel() {
    if (panel) {
      panel.hidden = false;
      panel.classList.add("open", "active");
    }
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  }

  function closePanel() {
    if (panel) {
      panel.hidden = true;
      panel.classList.remove("open", "active");
    }
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function addMessage(text, who) {
    if (!messages) {
      console.log(who + ": " + text);
      return;
    }

    const item = document.createElement("div");
    item.className = "assistant-message " + who;
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      /[\u0980-\u09FF]/.test(text) ? "bn-IN" : "en-IN";

    window.speechSynthesis.speak(utterance);
  }

  function localAnswer(message) {
    const lower = message.toLowerCase().trim();

    if (
      lower.includes("open home") ||
      lower.includes("home page") ||
      lower.includes("হোম পেজ")
    ) {
      window.location.href = "index.html";
      return "হোম পেজ খুলছি।";
    }

    if (
      lower.includes("open about") ||
      lower.includes("about page") ||
      lower.includes("অ্যাবাউট")
    ) {
      window.location.href = "about.html";
      return "About পেজ খুলছি।";
    }

    if (
      lower.includes("open services") ||
      lower.includes("services page") ||
      lower.includes("সার্ভিস")
    ) {
      window.location.href = "services.html";
      return "Services পেজ খুলছি।";
    }

    if (
      lower.includes("open contact") ||
      lower.includes("contact page") ||
      lower.includes("যোগাযোগ")
    ) {
      window.location.href = "contact.html";
      return "Contact পেজ খুলছি।";
    }

    if (
      lower.includes("hello") ||
      lower.includes("hi") ||
      lower.includes("নমস্কার") ||
      lower.includes("হ্যালো")
    ) {
      return "নমস্কার! আমি Rejaul Assistant। কীভাবে সাহায্য করতে পারি?";
    }

    return null;
  }

  async function handleMessage(rawMessage) {
    const message = String(rawMessage || "").trim();

    if (!message) {
      setStatus("প্রথমে কিছু লিখুন বা বলুন।");
      return;
    }

    addMessage(message, "user");
    if (input) input.value = "";
    setStatus("উত্তর খুঁজছি...");

    const answer = localAnswer(message);

    if (answer) {
      addMessage(answer, "assistant");
      speak(answer);
      setStatus("প্রস্তুত");
      return;
    }

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          question: message
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Backend error: " + response.status
        );
      }

      const reply =
        data.reply ||
        data.answer ||
        data.response ||
        data.message ||
        "সার্ভার থেকে উত্তর পাওয়া যায়নি।";

      addMessage(reply, "assistant");
      speak(reply);
      setStatus("প্রস্তুত");
    } catch (error) {
      console.error("Rejaul Assistant:", error);
      addMessage(
        "দুঃখিত, সার্ভারের সঙ্গে যোগাযোগ করা যাচ্ছে না। পরে আবার চেষ্টা করুন।",
        "assistant"
      );
      setStatus("সংযোগ সমস্যা: " + error.message);
    }
  }

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  let recognition = null;
  let listening = false;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "bn-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      listening = true;
      setStatus("শুনছি... এখন কথা বলুন।");
      if (micBtn) micBtn.setAttribute("aria-pressed", "true");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (input) input.value = transcript;
      handleMessage(transcript);
    };

    recognition.onerror = (event) => {
      setStatus("মাইক্রোফোন সমস্যা: " + event.error);
    };

    recognition.onend = () => {
      listening = false;
      if (micBtn) micBtn.setAttribute("aria-pressed", "false");
    };
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      if (panel && !panel.hidden &&
          panel.classList.contains("open")) {
        closePanel();
      } else {
        openPanel();
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closePanel);

  if (sendBtn) {
    sendBtn.addEventListener("click", () =>
      handleMessage(input ? input.value : "")
    );
  }

  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleMessage(input.value);
      }
    });
  }

  if (micBtn) {
    micBtn.addEventListener("click", () => {
      if (!recognition) {
        setStatus(
          "এই ব্রাউজারে Voice Recognition নেই। Android Chrome-এ চেষ্টা করুন।"
        );
        return;
      }

      if (listening) {
        recognition.stop();
        return;
      }

      try {
        recognition.start();
      } catch (error) {
        setStatus("মাইক্রোফোন চালু হয়নি: " + error.message);
      }
    });
  }

  setStatus("বাংলা বা English-এ লিখুন অথবা মাইক্রোফোন চাপুন।");
})();
