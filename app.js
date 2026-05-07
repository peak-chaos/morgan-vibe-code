const messagesEl = document.querySelector("#messages");
const composerEl = document.querySelector("#composer");
const promptEl = document.querySelector("#prompt");
const chipsEl = document.querySelector("#prompt-chips");

const seedMessages = [
  {
    role: "user",
    author: "Jess",
    time: "9:12 AM",
    text: "Morgan, what should our new frontline managers focus on this week if we want to build confidence quickly?",
  },
  {
    role: "assistant",
    author: "Morgan",
    time: "9:12 AM",
    text:
      "I’d start them with three learning picks.\n\nFirst, a coaching essentials course so they can run stronger one-on-ones and give clearer feedback from day one.\n\nSecond, a fundamentals module on setting team expectations, because new managers usually need help translating goals into weekly habits.\n\nThird, a short learning piece on difficult conversations so they feel more prepared when performance or prioritization issues come up.\n\nIf you want, I can tailor that list for sales managers, support managers, or first-time people leaders specifically.",
  },
];

let isResponding = false;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
  window.scrollTo({ top: 0, left: 0 });
});

seedMessages.forEach((message) => appendMessage(message));

composerEl.addEventListener("submit", async (event) => {
  event.preventDefault();

  const prompt = promptEl.value.trim();

  if (!prompt || isResponding) {
    return;
  }

  appendMessage({
    role: "user",
    author: "You",
    time: formatClock(),
    text: prompt,
  });

  promptEl.value = "";
  autoResizeTextarea();

  isResponding = true;
  const typingRow = appendTypingIndicator();

  await sleep(900);
  typingRow.remove();

  const reply = buildReply(prompt);
  await appendStreamingAssistantMessage(reply);
  isResponding = false;
});

promptEl.addEventListener("input", autoResizeTextarea);

promptEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    composerEl.requestSubmit();
  }
});

chipsEl.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  promptEl.value = target.textContent.trim();
  autoResizeTextarea();
  promptEl.focus();
  composerEl.requestSubmit();
});

function appendMessage({ role, author, time, text }) {
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.innerHTML = `
    ${renderAvatar(role, author)}
    <strong>${author}</strong>
    <span>${time}</span>
  `;

  const card = document.createElement("div");
  card.className = "message-card";
  card.innerHTML = renderParagraphs(text);

  article.append(meta, card);
  messagesEl.append(article);
  keepLatestInView();

  return article;
}

function appendTypingIndicator() {
  const article = document.createElement("article");
  article.className = "message assistant";

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.innerHTML = `
    ${renderAvatar("assistant", "Morgan")}
    <strong>Morgan</strong>
    <span>typing...</span>
  `;

  const typing = document.createElement("div");
  typing.className = "typing";
  typing.innerHTML = "<span></span><span></span><span></span>";

  article.append(meta, typing);
  messagesEl.append(article);
  keepLatestInView();

  return article;
}

async function appendStreamingAssistantMessage(text) {
  const article = document.createElement("article");
  article.className = "message assistant";

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.innerHTML = `
    ${renderAvatar("assistant", "Morgan")}
    <strong>Morgan</strong>
    <span>${formatClock()}</span>
  `;

  const card = document.createElement("div");
  card.className = "message-card";
  const body = document.createElement("div");
  body.setAttribute("aria-live", "off");
  card.append(body);
  article.append(meta, card);
  messagesEl.append(article);

  const tokens = text.split(" ");
  let current = "";

  for (const token of tokens) {
    current += `${current ? " " : ""}${token}`;
    body.innerHTML = renderParagraphs(current);
    keepLatestInView();
    await sleep(28);
  }
}

function buildReply(prompt) {
  const clean = prompt.toLowerCase();

  if (hasAny(clean, ["sales manager", "manager learn", "learn this week", "new manager", "people leader"])) {
    return (
      "Here’s a strong starting set for a new sales manager.\n\n" +
      "1. Coaching for performance: so they can run better one-on-ones and help reps improve week to week.\n\n" +
      "2. Setting clear expectations: so goals, activity standards, and follow-through feel consistent across the team.\n\n" +
      "3. Leading difficult conversations: so they are ready for underperformance, accountability, and feedback moments.\n\n" +
      "I picked these because they build confidence quickly and create early management habits that compound."
    );
  }

  if (hasAny(clean, ["teams", "onboarding specialist", "personalized learning", "specialist"])) {
    return (
      "For an onboarding specialist in Teams, I’d surface learning that helps them ramp quickly in the context of their actual work.\n\n" +
      "I’d recommend a customer onboarding fundamentals course, a module on stakeholder communication, and a short piece on project handoff best practices.\n\n" +
      "That mix supports execution, cross-functional confidence, and smoother customer experiences without overwhelming them."
    );
  }

  if (hasAny(clean, ["nudge", "customer success team", "team nudge", "learning nudge"])) {
    return (
      "Draft nudge:\n\n" +
      "\"Team, I pulled together a short learning set for this week focused on customer conversations, prioritization, and handling tricky moments with confidence. If you have 30 minutes, start with the first course today and I’ll share a few more tailored picks based on your role next.\""
    );
  }

  if (hasAny(clean, ["slack", "teams", "course", "courses", "learning", "recommend"])) {
    return (
      "Morgan works best when the recommendation feels personal, not like a catalog search result.\n\n" +
      "I’d usually respond with three course suggestions, a quick reason each one fits the learner, and one next step the manager or teammate can take immediately.\n\n" +
      "That keeps the experience useful inside Slack or Teams instead of forcing people into a bigger workflow."
    );
  }

  return (
    "I can help with that. In this demo, Morgan is a learning agent that surfaces personalized courses in Slack and Teams.\n\n" +
    "If you want, I can answer with role-based recommendations, a manager nudge, an onboarding path, or a short learning brief."
  );
}

function renderAvatar(role, author) {
  if (role === "assistant") {
    return `
      <span class="avatar avatar-morgan">
        <img src="./Morgan.png" alt="" />
      </span>
    `;
  }

  return `<span class="avatar avatar-user">${escapeHtml(getInitials(author))}</span>`;
}

function getInitials(author) {
  return author
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function renderParagraphs(text) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function hasAny(input, terms) {
  return terms.some((term) => input.includes(term));
}

function keepLatestInView() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function autoResizeTextarea() {
  promptEl.style.height = "auto";
  promptEl.style.height = `${Math.min(promptEl.scrollHeight, 220)}px`;
}

function formatClock() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

autoResizeTextarea();
