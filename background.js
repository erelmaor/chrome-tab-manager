// Tab management functions
class TabManager {
  static async getCurrentTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  static async getAllTabs() {
    return await chrome.tabs.query({ currentWindow: true });
  }

  static async closeOtherTabs() {
    const currentTab = await this.getCurrentTab();
    const allTabs = await this.getAllTabs();

    const tabsToClose = allTabs
      .filter((tab) => tab.id !== currentTab.id && !tab.pinned)
      .map((tab) => tab.id);

    if (tabsToClose.length > 0) {
      await chrome.tabs.remove(tabsToClose);
    }
  }

  static async newTabCloseOthers() {
    const allTabs = await this.getAllTabs();
    const newTab = await chrome.tabs.create({ active: true });

    const tabsToClose = allTabs
      .filter((tab) => !tab.pinned)
      .map((tab) => tab.id);

    if (tabsToClose.length > 0) {
      await chrome.tabs.remove(tabsToClose);
    }
  }

  static async duplicateTab() {
    const currentTab = await this.getCurrentTab();
    await chrome.tabs.duplicate(currentTab.id);
  }

  static async togglePinTab() {
    const currentTab = await this.getCurrentTab();
    await chrome.tabs.update(currentTab.id, { pinned: !currentTab.pinned });
  }

  // Additional functions for popup-only actions
  static async closeTabsToRight() {
    const currentTab = await this.getCurrentTab();
    const allTabs = await this.getAllTabs();

    const tabsToClose = allTabs
      .filter((tab) => tab.index > currentTab.index && !tab.pinned)
      .map((tab) => tab.id);

    if (tabsToClose.length > 0) {
      await chrome.tabs.remove(tabsToClose);
    }
  }

  static async closeTabsToLeft() {
    const currentTab = await this.getCurrentTab();
    const allTabs = await this.getAllTabs();

    const tabsToClose = allTabs
      .filter((tab) => tab.index < currentTab.index && !tab.pinned)
      .map((tab) => tab.id);

    if (tabsToClose.length > 0) {
      await chrome.tabs.remove(tabsToClose);
    }
  }

  static async moveToNewWindow() {
    const currentTab = await this.getCurrentTab();
    await chrome.windows.create({ tabId: currentTab.id });
  }

  static async closeDuplicateTabs() {
    const allTabs = await this.getAllTabs();
    const urlMap = new Map();
    const duplicateTabs = [];

    allTabs.forEach((tab) => {
      if (urlMap.has(tab.url)) {
        duplicateTabs.push(tab.id);
      } else {
        urlMap.set(tab.url, tab.id);
      }
    });

    if (duplicateTabs.length > 0) {
      await chrome.tabs.remove(duplicateTabs);
    }
  }

  static async closeUnpinnedTabs() {
    const allTabs = await this.getAllTabs();
    const tabsToClose = allTabs
      .filter((tab) => !tab.pinned)
      .map((tab) => tab.id);

    if (tabsToClose.length > 0) {
      await chrome.tabs.remove(tabsToClose);
    }
  }
}

// Command handlers for keyboard shortcuts
const commandHandlers = {
  "close-other-tabs": () => TabManager.closeOtherTabs(),
  "new-tab-close-others": () => TabManager.newTabCloseOthers(),
  "duplicate-tab": () => TabManager.duplicateTab(),
  "pin-unpin-tab": () => TabManager.togglePinTab(),
};

// Command handlers for popup actions (includes keyboard + additional)
const allCommandHandlers = {
  ...commandHandlers,
  "close-tabs-right": () => TabManager.closeTabsToRight(),
  "close-tabs-left": () => TabManager.closeTabsToLeft(),
  "move-to-new-window": () => TabManager.moveToNewWindow(),
  "close-duplicate-tabs": () => TabManager.closeDuplicateTabs(),
  "close-unpinned-tabs": () => TabManager.closeUnpinnedTabs(),
};

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  try {
    const handler = commandHandlers[command];
    if (handler) {
      await handler();

      // Show notification badge
      chrome.action.setBadgeText({ text: "✓" });
      chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
      }, 2000);
    }
  } catch (error) {
    console.error(`Error executing command ${command}:`, error);
  }
});

// Listen for popup button clicks
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.command) {
    try {
      const handler = allCommandHandlers[message.command];
      if (handler) {
        await handler();
        sendResponse({ success: true });
      }
    } catch (error) {
      console.error(`Error executing popup command ${message.command}:`, error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Keep message channel open for async response
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
});
