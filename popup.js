// Handle quick action buttons
document.addEventListener("DOMContentLoaded", async () => {
  // Load actual configured shortcuts
  await loadActualShortcuts();

  // Add click handlers for quick action buttons
  document.querySelectorAll(".action-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;

      // Send message to background script
      try {
        await chrome.runtime.sendMessage({ command: action });

        // Visual feedback
        const originalText = button.textContent;
        button.textContent = "✓";
        button.style.background = "#4CAF50";

        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = "";
        }, 1000);

        // Close popup after action
        setTimeout(() => {
          window.close();
        }, 500);
      } catch (error) {
        console.error("Error executing action:", error);
      }
    });
  });

  // Handle shortcut link
  document.getElementById("shortcut-link").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });
});

// Load actual configured shortcuts from Chrome
async function loadActualShortcuts() {
  try {
    const commands = await chrome.commands.getAll();

    // Map command names to their display elements
    const commandMap = {
      "close-other-tabs": "shortcut-1",
      "new-tab-close-others": "shortcut-2",
      "duplicate-tab": "shortcut-3",
      "pin-unpin-tab": "shortcut-4",
    };

    // Update each shortcut display
    commands.forEach((command) => {
      const elementId = commandMap[command.name];
      if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
          if (command.shortcut) {
            // Format the shortcut for display
            element.textContent = formatShortcutForDisplay(command.shortcut);
            element.style.opacity = "1";
          } else {
            element.textContent = "Not set";
            element.style.opacity = "0.5";
            element.style.fontStyle = "italic";
          }
        }
      }
    });
  } catch (error) {
    console.error("Error loading shortcuts:", error);
  }
}

// Format shortcut string for better display
function formatShortcutForDisplay(shortcut) {
  if (!shortcut) return "Not set";

  // Detect if user is on Mac
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  if (isMac) {
    // Convert to Mac symbols
    return shortcut
      .replace(/MacCtrl/g, "⌘")
      .replace(/Ctrl/g, "⌃")
      .replace(/Shift/g, "⇧")
      .replace(/Alt/g, "⌥")
      .replace(/\+/g, "");
  } else {
    // Keep as-is for Windows/Linux but clean up
    return shortcut.replace(/MacCtrl/g, "Cmd").replace(/\+/g, "+");
  }
}
