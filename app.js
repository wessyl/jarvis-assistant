
const responseBox = document.getElementById("response");
const voiceStatus = document.getElementById("voiceStatus");
const talkButton = document.getElementById("talkButton");
const stopButton = document.getElementById("stopButton");
const orb = document.getElementById("orb");
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

const JARVIS = {
  name: "JARVIS",
  user: "Westin",
  title: "Sir",
  language: "en-GB"
};

let recognition = null;
let isListening = false;
let tasks = JSON.parse(localStorage.getItem("jarvisTasks") || "[]");

const dialogue = {
  greeting: [
    "Good to see you, Sir. What can I do for you?",
    "At your service, Sir. I trust all is well.",
    "Welcome back, Sir. Shall we get started?"
  ],
  thanks: [
    "Always a pleasure, Sir.",
    "Quite right, Sir. You're most welcome.",
    "No need to thank me, Sir. That's what I'm here for."
  ],
  bored: [
    "An unfortunate condition, Sir. Shall I find you something productive to do, or are we embracing idleness today?",
    "Boredom, Sir? I wasn't aware that was part of the schedule."
  ],
  good: [
    "Splendid, Sir. I shall try not to let it go to my head.",
    "Excellent. I do appreciate a productive afternoon, Sir."
  ]
};

function randomReply(replies) {
  return replies[Math.floor(Math.random() * replies.length)];
}

function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = '<p class="empty">No outstanding priorities, Sir.</p>';
    return;
  }

  tasks.forEach((task, index) => {
    const item = document.createElement("div");
    item.style.cssText =
      "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid rgba(120,190,230,.15);";

    const label = document.createElement("span");
    label.textContent = task.text;
    label.style.cssText = "color:#c0d4e5;font-size:13px;";

    if (task.done) {
      label.style.textDecoration = "line-through";
      label.style.opacity = ".5";
    }

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:6px;";

    const complete = document.createElement("button");
    complete.textContent = task.done ? "UNDO" : "DONE";
    complete.style.cssText = "padding:8px;font-size:9px;margin:0;";
    complete.addEventListener("click", () => {
      tasks[index].done = !tasks[index].done;
      saveTasks();
    });

    const remove = document.createElement("button");
    remove.textContent = "×";
    remove.style.cssText = "padding:6px 10px;font-size:14px;margin:0;";
    remove.addEventListener("click", () => {
      tasks.splice(index, 1);
      saveTasks();
    });

    actions.append(complete, remove);
    item.append(label, actions);
    taskList.appendChild(item);
  });
}

function saveTasks() {
  localStorage.setItem("jarvisTasks", JSON.stringify(tasks));
  renderTasks();
}

function speak(message) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(message);
  speech.lang = JARVIS.language;
  speech.rate = 0.91;
  speech.pitch = 0.88;
  speech.volume = 1;

  const voices = window.speechSynthesis.getVoices();

  const preferredVoice = voices.find(voice =>
    /Daniel|Arthur|Oliver|Google UK English Male|Microsoft Ryan/i.test(voice.name)
  ) || voices.find(voice =>
    voice.lang === "en-GB" && /male/i.test(voice.name)
  ) || voices.find(voice =>
    voice.lang === "en-GB"
  );

  if (preferredVoice) {
    speech.voice = preferredVoice;
  }

  window.speechSynthesis.speak(speech);
}

function respond(message) {
  responseBox.textContent = message;
  speak(message);
}

function addTask(task) {
  tasks.push({ text: task, done: false });
  saveTasks();
}

function processCommand(command) {
  const text = command.toLowerCase().trim();

  if (!text) return;

  if (
    text.includes("hello") ||
    text.includes("hi jarvis") ||
    text.includes("good morning") ||
    text.includes("good evening") ||
    text.includes("hey jarvis")
  ) {
    respond(randomReply(dialogue.greeting));
    return;
  }

  if (text.includes("thank you") || text.includes("thanks")) {
    respond(randomReply(dialogue.thanks));
    return;
  }

  if (text.includes("how are you")) {
    respond("Operating rather splendidly, Sir. Though I must admit, my workload does seem to increase whenever you get an idea.");
    return;
  }

  if (text.includes("i am bored") || text.includes("i'm bored")) {
    respond(randomReply(dialogue.bored));
    return;
  }

  if (text.includes("well done") || text.includes("good job")) {
    respond(randomReply(dialogue.good));
    return;
  }

  if (
    text.includes("what time") ||
    text.includes("current time")
  ) {
    const time = new Date().toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit"
    });

    respond("It is currently " + time + ", Sir.");
    return;
  }

  if (
    text.includes("what date") ||
    text.includes("today's date") ||
    text.includes("what day")
  ) {
    const date = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    respond("Today is " + date + ", Sir.");
    return;
  }

  if (text.startsWith("add task ")) {
    const task = command.substring(9).trim();

    if (task) {
      addTask(task);
      respond("Very good, Sir. I've added that to your priorities.");
    } else {
      respond("What would you like me to add, Sir?");
    }
    return;
  }

  if (
    text.includes("how many tasks") ||
    text.includes("my priorities")
  ) {
    const remaining = tasks.filter(task => !task.done).length;

    if (remaining === 0) {
      respond("Nothing outstanding, Sir. An unusually peaceful state of affairs.");
    } else {
      respond("You have " + remaining + " outstanding priorities, Sir. Shall we make some progress?");
    }
    return;
  }

  if (text.includes("what are my tasks") || text.includes("read my tasks")) {
    const remaining = tasks.filter(task => !task.done);

    if (remaining.length === 0) {
      respond("Your task list is currently clear, Sir.");
    } else {
      respond("Certainly, Sir. Your outstanding tasks are: " +
        remaining.map(task => task.text).join(". ") + ".");
    }
    return;
  }

  if (text.includes("stop talking") || text.includes("be quiet")) {
    window.speechSynthesis.cancel();
    responseBox.textContent = "Speech stopped, Sir.";
    return;
  }

  respond("I heard you, Sir. I haven't been connected to my advanced intelligence system yet, but I'm listening. Would you care to try another command?");
}

function startListening() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    voiceStatus.textContent = "Voice recognition unavailable.";
    respond("I'm afraid this browser does not support my voice recognition system, Sir.");
    return;
  }

  if (isListening) return;

  recognition = new SpeechRecognition();
  recognition.lang = JARVIS.language;
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    voiceStatus.textContent = "Listening, Sir...";
    orb.style.filter = "brightness(1.7)";
  };

  recognition.onresult = event => {
    const command = event.results[0][0].transcript;
    voiceStatus.textContent = "Command received.";
    processCommand(command);
  };

  recognition.onerror = event => {
    voiceStatus.textContent = "Voice system: " + event.error;
  };

  recognition.onend = () => {
    isListening = false;
    orb.style.filter = "";

    if (voiceStatus.textContent === "Listening, Sir...") {
      voiceStatus.textContent = "Standing by for your command, Sir.";
    }
  };

  recognition.start();
}

function stopListening() {
  if (recognition && isListening) {
    recognition.stop();
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  voiceStatus.textContent = "Standing by for your command, Sir.";
  orb.style.filter = "";
}

talkButton.addEventListener("click", startListening);
stopButton.addEventListener("click", stopListening);

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const task = taskInput.value.trim();
  if (!task) return;

  addTask(task);
  taskInput.value = "";
  respond("Added to your priorities, Sir.");
});

renderTasks();

console.log("JARVIS initialized. At your service, Sir.");
