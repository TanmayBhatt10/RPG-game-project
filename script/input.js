// js/input.js
// exports a single inputState object (live bindings) and initInput()

export const inputState = {
  mouse: { x: 0, y: 0 },
  isFiring: false,
  currentWeapon: 1
};

export function initInput() {
  // Mouse
  document.addEventListener("mousemove", (e) => {
    inputState.mouse.x = e.clientX;
    inputState.mouse.y = e.clientY;
  });

  // Mouse buttons
  document.addEventListener("mousedown", () => inputState.isFiring = true);
  document.addEventListener("mouseup", () => inputState.isFiring = false);

  // weapon switch (Tab)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      inputState.currentWeapon = (inputState.currentWeapon % 4) + 1;
    }
  });
}
