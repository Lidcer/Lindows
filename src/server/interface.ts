interface DatabaseModifiable {
  save: () => void | Promise<void>;
}
