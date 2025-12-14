import { BehaviorSubject } from "rxjs";
import { setSelectedFile, state } from "./State";
import { enableTabs } from "./Settings";

interface Tab {
    key: string;
    scroll: number;
}

export const activeTabKey = new BehaviorSubject<string>(state.value.file);
export const openTabs = new BehaviorSubject<Tab[]>([{ key: state.value.file, scroll: 0 }]);
export const tabHistory = new BehaviorSubject<string[]>([state.value.file]);

export const openTab = (key: string) => {
    if (!enableTabs.value) {
        setSelectedFile(key);
        return;
    }

    const tabs = [...openTabs.value];
    const activeIndex = tabs.findIndex(tab => tab.key === activeTabKey.value);

    // If class is not already open, open it
    if (!tabs.some(tab => tab.key === key)) {
        const insertIndex = activeIndex >= 0 ? activeIndex + 1 : tabs.length;
        tabs.splice(insertIndex, 0, {
            key, scroll: 0
        });
        openTabs.next(tabs);
    }

    // Switch to the newly opened tab, if not already open to the right class
    if (activeTabKey.value !== key) {
        activeTabKey.next(key);
        setSelectedFile(key);

        if (tabHistory.value.length < 50) {
            // Limit history to 50
            tabHistory.next([...tabHistory.value, key]);
        }
    }
};

export const closeTab = (key: string) => {
    if (openTabs.value.length <= 1) return;

    tabHistory.next(tabHistory.value.filter(v => v != key));
    const modifiedOpenTabs = openTabs.value.filter(v => v.key != key);

    if (key === activeTabKey.value) {
        const history = [...tabHistory.value];
        let newKey = history.pop();
        tabHistory.next(history);

        if (!newKey) {
            // If undefined, open tab left of it
            let i = openTabs.value.findIndex(tab => tab.key === key) - 1;
            i = Math.max(i, 0);
            i = Math.min(i, modifiedOpenTabs.length - 1);
            newKey = modifiedOpenTabs[i].key;
        }

        openTab(newKey);
    }

    openTabs.next(modifiedOpenTabs);
};

export const setTabPosition = (key: string, placeIndex: number) => {
    const tabs = [...openTabs.value];
    const currentIndex = tabs.findIndex(tab => tab.key === key);
    if (currentIndex === -1) return;
    const currentTab = tabs[currentIndex];

    tabs.splice(currentIndex, 1);

    // Adjust index if moving right
    let index = placeIndex;
    if (placeIndex > currentIndex) index -= 1;

    tabs.splice(index, 0, currentTab);
    openTabs.next(tabs);
};
