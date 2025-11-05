import { BehaviorSubject } from "rxjs";

const DEFAULT_FILE = "net/minecraft/ChatFormatting.class";

const getInitialFile = (): string => {
  const path = window.location.pathname;
  const fileFromUrl = path.startsWith('/') ? decodeURIComponent(path.slice(1)) : '';

  if (!fileFromUrl) {
    return DEFAULT_FILE;
  }

  return fileFromUrl.endsWith('.class') ? fileFromUrl : fileFromUrl + '.class';
};

export const selectedFile = new BehaviorSubject<string>(getInitialFile());

selectedFile.subscribe(file => {
  window.history.replaceState({}, '', `/${file.replace(".class", "")}`);
  const filename = file.split('/').pop() || file;
  document.title = filename.replace('.class', '');
});