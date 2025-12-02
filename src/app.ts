const textArea = document.querySelector("#input") as HTMLTextAreaElement;
const remainingCharactersElement = document.querySelector(
  "#remaining-characters"
) as HTMLElement;
const currentCharacterCountElement = document.querySelector(
  "#current-character-count"
) as HTMLElement;
const translationElement = document.querySelector(
  "#translation"
) as HTMLElement;
const submitButton = document.querySelector(
  "#submit-button"
) as HTMLButtonElement;
const previousTranslationsContainer = document.querySelector(
  "#previous-translations-container"
) as HTMLElement;
const suggestionsContainer = document.querySelector(
  "#suggestions-container"
) as HTMLElement;

const PREVIOUS_TRANSLATIONS_KEY = "previousTranslations";

interface PreviousTranslation {
  id: number;
  input: string;
  translation: string;
  expires: number;
}

const previousTranslationsStore = {
  getAll: (): PreviousTranslation[] => {
    const data = localStorage.getItem(PREVIOUS_TRANSLATIONS_KEY);
    const translations = data ? JSON.parse(data) : [];
    const now = Date.now();

    return translations.filter((t: PreviousTranslation) => t.expires > now);
  },
  addTranslation: (translation: PreviousTranslation) => {
    const currentTranslations = previousTranslationsStore.getAll();
    const newTranslations = [translation, ...currentTranslations].slice(0, 4);

    localStorage.setItem(
      PREVIOUS_TRANSLATIONS_KEY,
      JSON.stringify(newTranslations)
    );
  },
  removeTranslation: (id: number) => {
    const currentTranslations = previousTranslationsStore.getAll();
    const newTranslations = currentTranslations.filter((t) => t.id !== id);

    localStorage.setItem(
      PREVIOUS_TRANSLATIONS_KEY,
      JSON.stringify(newTranslations)
    );
  },
};

const onPreviousTranslationClick = (e: Event) => {
  const button = e.currentTarget as HTMLButtonElement;
  const id = parseInt(button.dataset.id || "", 10);

  if (isNaN(id)) {
    return;
  }

  const translation = previousTranslationsStore
    .getAll()
    .find((t) => t.id === id);

  if (!translation) {
    return;
  }

  textArea.value = translation.input;
  translationElement.textContent = translation.translation;
};

const onPreviousTranslationDelete = (e: Event) => {
  const button = e.currentTarget as HTMLButtonElement;
  const id = parseInt(button.dataset.id || "", 10);

  if (isNaN(id)) {
    return;
  }

  previousTranslationsStore.removeTranslation(id);
  setupPreviousTranslations();
  setupSuggestions();
};

const setupPreviousTranslations = () => {
  const existingTitle = previousTranslationsContainer.querySelector("h2");
  if (existingTitle) {
    existingTitle.remove();
  }
  const existingList = previousTranslationsContainer.querySelector("ul");
  if (existingList) {
    existingList.remove();
  }

  const translations = previousTranslationsStore.getAll();

  if (translations.length === 0) {
    previousTranslationsContainer.style.display = "none";
    return;
  }

  const title = document.createElement("h2");
  title.textContent = "Previous translations";
  previousTranslationsContainer.appendChild(title);

  const translationsList = document.createElement("ul");

  translations.forEach((translation) => {
    const listItem = document.createElement("li");

    const viewButton = document.createElement("button");
    viewButton.className = "view-translation-button";
    viewButton.dataset.id = translation.id.toString();
    viewButton.addEventListener("click", onPreviousTranslationClick);
    listItem.appendChild(viewButton);

    const inputText = document.createElement("span");
    inputText.textContent = translation.input;
    inputText.className = "input-text";
    viewButton.appendChild(inputText);

    const translationText = document.createElement("em");
    translationText.textContent = translation.translation;
    translationText.className = "translation-text";
    viewButton.appendChild(translationText);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "✖";
    deleteButton.className = "delete-translation-button";
    deleteButton.dataset.id = translation.id.toString();
    deleteButton.addEventListener("click", onPreviousTranslationDelete);
    listItem.appendChild(deleteButton);

    translationsList.appendChild(listItem);
  });

  previousTranslationsContainer.appendChild(translationsList);
  previousTranslationsContainer.removeAttribute("style");
};

const setupSuggestions = () => {
  const hasPreviousTranslations = previousTranslationsStore.getAll().length > 0;
  if (hasPreviousTranslations) {
    suggestionsContainer.style.display = "none";
    return;
  }

  const suggestions = [
    "The sky looks blue but it isn't, what does it mean?",
    "I love the holidays and spending time with family",
    "Feeling blue left on red",
    "You smell really bad and I wish you would take a shower",
    "A rolling stone gathers no moss but it sure gathers speed",
    "That's just like your opinion, man",
  ];

  const title = document.createElement("h2");
  title.textContent = "Try a suggestion:";
  suggestionsContainer.appendChild(title);

  const suggestionsList = document.createElement("section");
  suggestionsList.className = "suggestions-list";

  suggestions.forEach((suggestion) => {
    const button = document.createElement("button");
    button.textContent = suggestion;
    button.addEventListener("click", () => {
      textArea.value = suggestion;
      onSubmit();
    });
    suggestionsList.appendChild(button);
  });

  suggestionsContainer.appendChild(suggestionsList);
  suggestionsContainer.removeAttribute("style");
};

const onSubmit = async () => {
  const value = textArea.value?.trim() ?? "";
  if (!value) return;

  translationElement.removeAttribute("style");
  translationElement.textContent = "Translating...";

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: value }),
    });

    if (!response.ok) {
      throw new Error("Translation request failed");
    }

    const data = (await response.json()) as { translation: string };
    translationElement.textContent = data.translation;
    const newTranslation: PreviousTranslation = {
      id: Date.now(),
      input: value,
      translation: data.translation,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    previousTranslationsStore.addTranslation(newTranslation);
    setupPreviousTranslations();
  } catch (error) {
    translationElement.textContent = "An error occurred while translating 😭";
    translationElement.style.color = "red";
  }
};

const checkCharacterCount = () => {
  const currentLength = textArea.value.length;

  if (currentLength > 1800) {
    remainingCharactersElement.style.display = "block";
    currentCharacterCountElement.textContent = currentLength.toString();
  } else {
    remainingCharactersElement.style.display = "none";
  }
};

checkCharacterCount();
setupPreviousTranslations();
setupSuggestions();

submitButton.addEventListener("click", async () => {
  await onSubmit();
});

textArea.addEventListener("input", checkCharacterCount);
