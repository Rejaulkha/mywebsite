
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
    console.warn("Voice Assistant HTML elements were not found.");
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  let recognition = null;
  let listening = false;
  let contactStep = "";
  let contactData = {};

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

  function openSection(section) {
    const target = document.querySelector(section);

    if (!target) {
      reply("এই section-টি খুঁজে পেলাম না।");
      return;
    }

    target.scrollIntoView({ behavior: "smooth" });
    reply("ঠিক আছে! Section খুলে দিচ্ছি।");
  }

  function findContactField(type) {
    const contact = document.querySelector("#contact");

    if (!contact) return null;

    if (type === "name") {
      return contact.querySelector(
        'input[name="name"], input[name="full_name"], input[autocomplete="name"], input[type="text"]'
      );
    }

    if (type === "email") {
      return contact.querySelector('input[type="email"]');
    }

    if (type === "message") {
      return contact.querySelector("textarea");
    }

    return null;
  }

  function setFieldValue(type, value) {
    const field = findContactField(type);

    if (!field) return false;

    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function handleContactFlow(text) {
    if (contactStep === "name") {
      contactData.name = text;
      setFieldValue("name", text);
      contactStep = "email";
      reply("এবার তোমার email address বলো বা লিখো।");
      return true;
    }

    if (contactStep === "email") {
      const email = text.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
      );

      if (!email) {
        reply("Email address-টি ঠিকভাবে লিখে আবার চেষ্টা করো।");
        return true;
      }

      contactData.email = email[0];
      setFieldValue("email", email[0]);
      contactStep = "message";
      reply("এবার তোমার message বলো বা লেখো।");
      return true;
    }

    if (contactStep === "message") {
      contactData.message = text;
      setFieldValue("message", text);
      contactStep = "confirm";

      reply(
        "তোমার তথ্য contact form-এ বসানো হয়েছে। Submit করতে চাইলে Yes বলো, না হলে No বলো। আমি তোমার অনুমতি ছাড়া submit করব না।"
      );
      return true;
    }

    if (contactStep === "confirm") {
      const answer = text.toLowerCase().trim();

      if (/^(yes|হ্যাঁ|হ্যাঁ করো|submit|confirm|ঠিক আছে)$/.test(answer)) {
        const contact = document.querySelector("#contact");
        const submitButton = contact?.querySelector(
          'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) {
          contactStep = "";
          contact.scrollIntoView({ behavior: "smooth" });
          reply("Submit button প্রস্তুত। পাঠানোর আগে form-টি একবার দেখে button-এ চাপ দাও।");
        } else {
          reply("Submit button খুঁজে পেলাম না। Form-টি নিজে দেখে submit করো।");
          contactStep = "";
        }
      } else if (/^(no|না|cancel|বাতিল)$/.test(answer)) {
        contactStep = "";
        reply("ঠিক আছে। Message submit করা হয়নি।");
      } else {
        reply("Submit করতে Yes বলো, অথবা বাতিল করতে No বলো।");
      }

      return true;
    }

    return false;
  }

  function handleMessage(originalText) {
    const text = originalText.trim();
    const lower = text.toLowerCase();

    if (!text) return;

    if (handleContactFlow(text)) return;

    if (
      lower.includes("contact form") ||
      lower.includes("fill form") ||
      lower.includes("যোগাযোগ") ||
      lower.includes("কন্টাক্ট ফর্ম")
    ) {
      contactStep = "name";
      contactData = {};
      openSection("#contact");
      reply("চলো contact form পূরণ করি। প্রথমে তোমার নাম বলো বা লেখো।");
      return;
  if (
  lower.includes("open home") ||
  lower.includes("go home") ||
  lower === "home" ||
  lower.includes("হোম খোলো") ||
  lower.includes("হোম")
) {
  openSection("#home");
  return;
  }
    }

    if (lower.includes("open about") || lower.includes("about section")) {
      openSection("#about");
      return;
    }

    if (lower.includes("open services") || lower.includes("সার্ভিস খোলো")) {
      openSection("#services");
      return;
    }

    if (lower.includes("open projects") || lower.includes("প্রজেক্ট খোলো")) {
      openSection("#projects");
      return;
    }

    if (lower.includes("open contact") || lower.includes("contact section")) {
      openSection("#contact");
      return;
    }

    if (
      lower.includes("who are you") ||
      lower.includes("তুমি কে")
    ) {
      reply("আমি Rejaul-এর website voice assistant। বাংলা ও English-এ সাহায্য করার চেষ্টা করি।");
      return;
    }

    if (
      lower.includes("what services") ||
      lower.includes("তুমি কি কাজ করো")
    ) {
      reply("Services section খুলে দেখো। সেখানে website-এর services সম্পর্কে জানতে পারবে।");
      openSection("#services");
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

    reply(
      "আমি এখন website navigation এবং কিছু সাধারণ প্রশ্নে সাহায্য করতে পারি। অন্য প্রশ্নের জন্য আরও AI backend যুক্ত করতে হবে।"
    );
  }

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

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";
    handleMessage(text);
  });

  if (mic) {
    if (!SpeechRecognition) {
      mic.addEventListener("click", () => {
        reply("এই browser-এ voice recognition support নেই। Chrome-এ চেষ্টা করো অথবা message লিখে পাঠাও।");
      });
    } else {
      recognition = new SpeechRecognition();
      recognition.lang = language?.value || "bn-IN";
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        listening = true;
        setStatus("Listening... / শুনছি...");
        mic.textContent = "🔴 Listening";
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        addMessage(transcript, "user");
        handleMessage(transcript);
      };

      recognition.onerror = (event) => {
        setStatus("Microphone: " + event.error);
      };

      recognition.onend = () => {
        listening = false;
        mic.textContent = "🎤 Speak";
        if (status && status.textContent.includes("Listening")) {
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
        } catch (error) {
          setStatus("আবার চেষ্টা করো / Please try again");
        }
      });

      language?.addEventListener("change", () => {
        recognition.lang = language.value;
      });
    }
  }

  setStatus("Ready / প্রস্তুত");
});
        
