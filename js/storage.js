/*
  storage.js — saves Trackr's data in this browser's localStorage.

  localStorage is a small key/value store built into every browser. It only
  holds text, so we turn data into JSON text when saving and back when loading.
  The data stays on this computer, in this browser, until you clear it.

  Each kind of data gets its own key:
    trackr.assignments  list of assignments you added
    trackr.plans        steps + time guesses for each assignment, by id
    trackr.parking      parking-lot thoughts
    trackr.stats        daily counts of steps done and focus minutes
    trackr.focus        id of the assignment you're focused on
*/
const Store = (() => {
  const PREFIX = "trackr.";

  // Read a saved value. Returns `fallback` if nothing is saved yet
  // or the browser won't let us read (for example, in some private windows).
  function load(name, fallback) {
    try {
      const text = localStorage.getItem(PREFIX + name);
      return text === null ? fallback : JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  }

  // Save a value. Returns true if it worked, or an error code if it didn't.
  function save(name, value) {
    try {
      localStorage.setItem(PREFIX + name, JSON.stringify(value));
      return true;
    } catch (e) {
      return e && e.name === "QuotaExceededError" ? "quota_exceeded" : "unavailable";
    }
  }

  // Run `callback(name)` when another tab of Trackr changes saved data,
  // so two open tabs stay in sync.
  function onChange(callback) {
    window.addEventListener("storage", e => {
      if (e.key && e.key.startsWith(PREFIX)) callback(e.key.slice(PREFIX.length));
    });
  }

  return { load, save, onChange };
})();
