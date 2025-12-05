function selectMethod(el) {
  document
    .querySelectorAll(".method-option")
    .forEach((opt) => opt.classList.remove("selected"));
  el.classList.add("selected");
}
