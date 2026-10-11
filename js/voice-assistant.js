
/* REJAUL BILINGUAL VOICE ASSISTANT */

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("voiceAssistantToggle");
  const panel = document.getElementById("voiceAssistantPanel");
  const close = document.getElementById("voiceAssistantClose");
  const mic = document.getElementById("voiceMic");
  const language = document.getElementById("voiceLanguage");
  const form = document.getElementById("voiceChatForm");
  const input = document.getElementById("voiceInput");
  const messages = document.getElementById("voiceMessages");
  const status = document.getElementById("voiceStatus");

  if (!toggle || !panel || !form || !input || !messages) {
    console.error("Rejaul Assistant: Required HTML elements missing.");
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  let recognition = null;
  let listening = false;
  let contactStep = "";

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function addMessage(text, sender = "assistant") {
    const message = document.createElement("p");
    message.className =
      "voice-message " +
      (sender === "user" ? "user-message" : "assistant-message");
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language?.value || "bn-IN";
    utterance.rate = 0.95;

    window.speechSynthesis.speak(utterance);
  }

  function reply(text, shouldSpeak = true) {
    addMessage(text);
    setStatus("Ready / প্রস্তুত");

    if (shouldSpeak) speak(text);
  }

  function openSection(selector) {
    const target = document.querySelector(selector);

    if (!target) {
      reply("এই section-টি খুঁজে পেলাম না।");
      return;
    }

    target.scrollIntoView({ behavior: "smooth" });
    reply("ঠিক আছে! Section খুলে দিচ্ছি।");
  }

  function setContactField(type, value) {
    const contact = document.querySelector("#contact");
    if (!contact) return false;

    let field = null;

    if (type === "name") {
      field = contact.querySelector(
        'input[name="name"], input[name="full_name"], ' +
        'input[autocomplete="name"], input[type="text"]'
      );
    } else if (type === "email") {
      field = contact.querySelector('input[type="email"]');
    } else if (type === "message") {
      field = contact.querySelector("textarea");
    }

    if (!field) return false;

    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function handleContact(text) {
    if (!contactStep) return false;

    if (contactStep === "name") {
      setContactField("name", text);
      contactStep = "email";
      reply("এবার তোমার email address বলো বা লেখো।");
      return true;
    }

    if (contactStep === "email") {
      const match = text.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
      );

      if (!match) {
        reply("Email ঠিকভাবে বুঝতে পারিনি। আবার বলো বা লিখো।");
        return true;
      }

      setContactField("email", match[0]);
      contactStep = "message";
      reply("এবার তোমার message বলো বা লেখো।");
      return true;
    }

    if (contactStep === "message") {
      setContactField("message", text);
      contactStep = "";
      reply(
        "Message contact form-এ বসানো হয়েছে। " +
        "তথ্য যাচাই করে Submit button-এ চাপ দাও।"
      );
      return true;
    }

    return false;
  }

  async function askAssistant(text) {
    setStatus("AI is thinking... / উত্তর তৈরি হচ্ছে...");

    try {
      const response = await fetch(
        "https://mywebsite-0eok.onrender.com/api/assistant",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: text })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success || !data.answer) {
        throw new Error(data.message || "AI request failed");
      }

      reply(data.answer);
    } catch (error) {
      console.error("Rejaul Assistant API error:", error);
      reply(
        "দুঃখিত, AI service এখন কাজ করছে না। " +
        "সাধারণ command ব্যবহার করো অথবা পরে চেষ্টা করো।"
      );
    }
  }

  function handleMessage(originalText) {
    const text = originalText.trim();
    const lower = text.toLowerCase();

    if (!text) return;

    if (handleContact(text)) return;

    if (
      lower.includes("contact form") ||
      lower.includes("fill form") ||
      lower.includes("যোগাযোগ") ||
      lower.includes("কন্টাক্ট ফর্ম")
    ) {
      contactStep = "name";
      openSection("#contact");
      reply("চলো contact form পূরণ করি। প্রথমে তোমার নাম বলো বা লেখো।");
      return;
    }

    if (
      lower.includes("open home") ||
      lower.includes("go home") ||
      lower === "home" ||
      lower.includes("হোম")
    ) {
      openSection("#home");
      return;
    }

    if (
      lower.includes("open about") ||
      lower.includes("about section") ||
      lower.includes("অ্যাবাউট")
    ) {
      openSection("#about");
      return;
    }

    if (
      lower.includes("open services") ||
      lower.includes("সার্ভিস খোলো") ||
      lower.includes("সার্ভিস")
    ) {
      openSection("#services");
      return;
    }

    if (
      lower.includes("open projects") ||
      lower.includes("প্রজেক্ট খোলো")
    ) {
      openSection("#projects");
      return;
    }

    if (
      lower.includes("open contact") ||
      lower.includes("contact section")
    ) {
      openSection("#contact");
      return;
    }

    if (
      lower.includes("who are you") ||
      lower.includes("তুমি কে")
    ) {
      reply(
        "আমি Rejaul-এর website voice assistant। " +
        "বাংলা ও English-এ সাহায্য করার চেষ্টা করি।"
      );
      return;
    }

    if (
      lower.includes("hello") ||
      lower.includes("hi") ||
      lower.includes("নমস্কার") ||
      lower.includes("হ্যালো")
    ) {
      reply("Hello! নমস্কার! কীভাবে সাহায্য করতে পারি?");
      return;
    }

    if (
      lower.includes("thank you") ||
      lower.includes("ধন্যবাদ")
    ) {
      reply("You're welcome! তোমাকে সাহায্য করতে পেরে ভালো লাগল।");
      return;
    }

    askAssistant(text);
  }

  // Open and close the assistant panel
  toggle.addEventListener("click", () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    toggle.setAttribute("aria-expanded", String(opening));

    if (opening) input.focus();
  });

  close?.addEventListener("click", () => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  });

  // Text message submission
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";
    handleMessage(text);
  });

  // Microphone and speech recognition
  if (mic) {
    if (!SpeechRecognition) {
      mic.addEventListener("click", () => {
        reply(
          "এই browser-এ speech recognition সমর্থিত নয়। " +
          "Chrome-এ চেষ্টা করো অথবা message লিখে পাঠাও।"
        );
      });
    } else {
      recognition = new SpeechRecognition();
      recognition.lang = language?.value || "bn-IN";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        listening = true;
        setStatus("Listening... / শুনছি...");
        mic.textContent = "🔴 Listening";
      };

      recognition.onresult = (event) => {
        const transcript =
          event.results[0][0].transcript.trim();

        if (!transcript) {
          setStatus("কথা বুঝতে পারিনি / No speech detected");
          return;
        }

        input.value = transcript;
        addMessage(transcript, "user");
        handleMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        const errors = {
          "not-allowed": "Microphone permission Allow করো।",
          "service-not-allowed": "Browser speech service অনুমোদিত নয়।",
          "no-speech": "কোনো কথা শনাক্ত হয়নি। আবার চেষ্টা করো।",
          "network": "Speech service-এর network সমস্যা হয়েছে।",
          "audio-capture": "Microphone পাওয়া যাচ্ছে না।"
        };

        setStatus(
          "Mic Error: " +
          (errors[event.error] || event.error)
        );
      };

      recognition.onend = () => {
        listening = false;
        mic.textContent = "🎤 Speak";

        if (status?.textContent.includes("Listening")) {
          setStatus("Ready / প্রস্তুত");
        }
      };

      mic.addEventListener("click", () => {
        if (listening) {
          recognition.stop();
          return;
        }

        recognition.lang = language?.value || "bn-IN";

        try {
          recognition.start();
          setStatus("Starting microphone...");
        } catch (error) {
          console.error("Microphone start error:", error);
          setStatus("Mic start failed: " + error.message);
        }
      });

      language?.addEventListener("change", () => {
        recognition.lang = language.value;
      });
    }
  }

  setStatus("Ready / প্রস্তুত");
});
