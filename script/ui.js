// js/ui.js
// Simple functions to update DOM elements for level/xp/weapon/damage

export function updateWeaponDisplay(inputState, state) {
  // inputState.currentWeapon is live
  const weaponEl = document.getElementById("weapon");
  const damageEl = document.getElementById("damage");
  if (weaponEl) weaponEl.textContent = inputState.currentWeapon;
  // compute baseDamage same as earlier logic
  let baseDamage;
  if (state.level >= 10 && inputState.currentWeapon === 4) baseDamage = 10;
  else if (state.level >= 6 && inputState.currentWeapon === 3) baseDamage = 7;
  else if (state.level >= 3 && inputState.currentWeapon === 2) baseDamage = 4;
  else baseDamage = 3;
  if (damageEl) damageEl.textContent = baseDamage;
}

export function updateXPUI(state) {
  const levelEl = document.getElementById("level");
  const xpEl = document.getElementById("xp");
  const xpNextEl = document.getElementById("xpNext");
  if (levelEl) levelEl.textContent = state.level;
  if (xpEl) xpEl.textContent = state.xp;
  if (xpNextEl) xpNextEl.textContent = state.xpToNext;
}

/**
 * gainXP(amount, state)
 * - state: { level, xp, xpToNext } (mutated)
 * - returns whether level increased
 */
export function gainXP(amount, state) {
  state.xp += amount;
  let leveled = false;
  while (state.xp >= state.xpToNext && state.level < 10) {
    state.xp -= state.xpToNext;
    state.level++;
    state.xpToNext = Math.floor(state.xpToNext * 1.5);
    leveled = true;
  }
  updateXPUI(state);
  return leveled;
}
