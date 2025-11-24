const textArea = document.querySelector("#input") as HTMLTextAreaElement;
const translatedText = document.querySelector("#output") as HTMLElement;
const submitButton = document.querySelector(
  "#submit-button"
) as HTMLButtonElement;

const API_URL = process.env.WOOWOO_API_URL;

const onSubmit = async () => {
  const text = textArea.value.trim();
  if (!text) return;

  translatedText.textContent = "Translating...";

  if (!API_URL) {
    translatedText.textContent = "API URL not configured.";
    return;
  }

  const response = await fetch(`${API_URL}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  translatedText.textContent = data.translation;
};

submitButton.addEventListener("click", async () => {
  await onSubmit();
});
