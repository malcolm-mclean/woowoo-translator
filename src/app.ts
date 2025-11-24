const textArea = document.querySelector("#input") as HTMLTextAreaElement;
const translatedText = document.querySelector("#output") as HTMLElement;
const submitButton = document.querySelector(
  "#submit-button"
) as HTMLButtonElement;

const onSubmit = async () => {
  const text = textArea.value.trim();
  if (!text) return;

  translatedText.textContent = "Translating...";

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = (await response.json()) as { translation: string };
  translatedText.textContent = data.translation;
};

submitButton.addEventListener("click", async () => {
  await onSubmit();
});
