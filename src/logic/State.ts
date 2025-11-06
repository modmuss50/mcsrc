import { BehaviorSubject, map } from "rxjs";

export interface State {
  version: number; // Allows us to change the permalink structure in the future
  minecraftVersion: string;
  file: string;
}

const DEFAULT_STATE: State = {
  version: 1,
  minecraftVersion: "25w45a",
  file: "net/minecraft/ChatFormatting.class"
};

const getInitialState = (): State => {
  const path = window.location.pathname;
  const segments = path.startsWith('/') ? path.slice(1).split('/') : path.split('/');
  
  const validSegments = segments.filter(s => s.length > 0);
  
  if (validSegments.length < 3) {
    return DEFAULT_STATE;
  }
  
  const version = parseInt(validSegments[0], 10);
  const minecraftVersion = decodeURIComponent(validSegments[1]);
  const filePath = validSegments.slice(2).join('/');
  
  return {
    version,
    minecraftVersion,
    file: filePath + (filePath.endsWith('.class') ? '' : '.class')
  };
};

export const state = new BehaviorSubject<State>(getInitialState());
export const selectedFile = state.pipe(
  map(s => s.file)
);

state.subscribe(s => {
  const url = `/${s.version}/${s.minecraftVersion}/${s.file.replace(".class", "")}`;
  window.history.replaceState({}, '', url);
  

  document.title = s.file.replace('.class', '');
});

export function setSelectedFile(file: string) {
  const currentState = state.getValue();
  state.next({
    ...currentState,
    file
  });
}