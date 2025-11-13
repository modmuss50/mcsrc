import { BehaviorSubject, distinctUntilChanged, map } from "rxjs";
import { selectedMinecraftVersion } from "./MinecraftApi";
import { diffView } from "./Diff";

export interface State {
  version: number; // Allows us to change the permalink structure in the future
  minecraftVersion: string;
  file: string;
}

const DEFAULT_STATE: State = {
  version: 0,
  minecraftVersion: "",
  file: "net/minecraft/ChatFormatting.class"
};

const getInitialState = (): State => {
  const hash = window.location.hash;
  const path = hash.startsWith('#/') ? hash.slice(2) : (hash.startsWith('#') ? hash.slice(1) : '');
  const segments = path.split('/').filter(s => s.length > 0);

  if (segments.length < 3) {
    return DEFAULT_STATE;
  }

  const version = parseInt(segments[0], 10);
  let minecraftVersion = decodeURIComponent(segments[1]);
  const filePath = segments.slice(2).join('/');

  // Backwards compatibility with the incorrect version name used previously
  if (minecraftVersion == "25w45a") {
    minecraftVersion = "25w45a_unobfuscated";
  }

  return {
    version,
    minecraftVersion,
    file: filePath + (filePath.endsWith('.class') ? '' : '.class')
  };
};

export const state = new BehaviorSubject<State>(getInitialState());
export const selectedFile = state.pipe(
  map(s => s.file),
  distinctUntilChanged()
);

state.subscribe(s => {
  if (s.version == 0) {
    return;
  }

  let url = `#${s.version}/${s.minecraftVersion}/${s.file.replace(".class", "")}`;

  if (diffView.value) {
    url = "";
  }

  window.history.replaceState({}, '', url);

  document.title = s.file.replace('.class', '');
});

export function updateSelectedMinecraftVersion() {
  const previous = state.value;

  if (previous.minecraftVersion === selectedMinecraftVersion.value) {
    return;
  }

  state.next({
    ...previous,
    minecraftVersion: selectedMinecraftVersion.value || ""
  });
}

export function setSelectedFile(file: string) {
  state.next({
    version: 1,
    minecraftVersion: selectedMinecraftVersion.value || "",
    file
  });
}