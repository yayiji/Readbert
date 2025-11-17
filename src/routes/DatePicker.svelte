<script>
  import { createEventDispatcher } from "svelte";
  import { CalendarDays, MoreHorizontal } from "@lucide/svelte";
  import CalendarPopup from "./CalendarPopup.svelte";

  let { value = $bindable("") } = $props();

  const dispatch = createEventDispatcher();

  let isOpen = $state(false);
  let isMenuOpen = $state(false);

  function formatDisplayDate(dateString) {
    return dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Select Date";
  }

  function togglePicker() {
    closeMenu();
    isOpen = !isOpen;
  }

  function closePicker() {
    isOpen = false;
  }

  function toggleMenu() {
    closePicker();
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  function closeAll() {
    closePicker();
    closeMenu();
  }

  function handleConfirm(event) {
    const selectedDate = event.detail?.value;
    if (selectedDate) {
      value = selectedDate;
    }
    closePicker();
  }

  function handleMenuSelect(extension) {
    dispatch("openAsset", { extension });
    closeMenu();
  }

  function handleOutsideClick(event) {
    if (!event.target.closest(".date-picker")) closeAll();
  }

  function handleKeydown(event) {
    if (event.key === "Escape" && (isOpen || isMenuOpen)) closeAll();
  }
</script>

<svelte:window onclick={handleOutsideClick} onkeydown={handleKeydown} />

<div class="date-picker">
  <div class="date-controls">
    <button
      class="date-input"
      onclick={togglePicker}
      aria-expanded={isOpen}
      aria-label="Select date"
      type="button"
    >
    <CalendarDays class="calendar-icon" size={16} />
      <span class="date-text">{formatDisplayDate(value)}</span>
    </button>

    <div class="more-wrapper">
      <button
        class="more-btn"
        onclick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-label="Open more options"
        type="button"
      >
        <MoreHorizontal size={18} />
      </button>

      {#if isMenuOpen}
        <div class="more-menu" role="menu">
          <button
            class="menu-item"
            onclick={() => handleMenuSelect("gif")}
            role="menuitem"
            type="button"
          >
            View GIF on Dilbert All
          </button>
          <button
            class="menu-item"
            onclick={() => handleMenuSelect("json")}
            role="menuitem"
            type="button"
          >
            View JSON on Dilbert All
          </button>
        </div>
      {/if}
    </div>
  </div>

  {#if isOpen}
    <CalendarPopup {value} on:confirm={handleConfirm} on:cancel={closePicker} />
  {/if}
</div>

<style>
  .date-picker {
    position: relative;
    display: inline-block;
  }

  .date-controls {
    display: inline-flex;
    align-items: center;
    gap: 0rem;
  }

  .date-input {
    color: black;
    background: transparent;
    border: none;
    font-family: var(--font-serif);
    font-size: 0.9rem;
    font-weight: bold;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 0rem 0rem;
    transition: all 0.2s ease;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
  }

  .date-input :global(.calendar-icon) {
    flex-shrink: 0;
    opacity: 0.8;
    transition: opacity 0.2s ease;
    transform: translateY(-1px);
    width: 1rem;
    height: 1rem;
  }

  .more-wrapper {
    position: relative;
  }

  .more-btn {
    color: var(--text-color);
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: translateX(-3px);
    border-radius: 999px;
    transition: background-color 0.2s ease;
  }

  /* .more-btn {
    display: none;
  } */


  .more-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: rgba(248, 246, 240, 0.95);
    border: 1px solid rgba(139, 125, 107, 0.4);
    box-shadow: var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.15));
    min-width: 220px;
    padding: 0.5rem 0;
    z-index: 1100;
  }

  .menu-item {
    width: 100%;
    background: transparent;
    border: none;
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
    font-size: 0.8rem;
    text-align: left;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
    color: var(--text-color);
  }

  .menu-item:hover {
    background: var(--bg-light, #f8f6f0);
    font-weight: bold;
  }

  /* Hover feedback only for hover-capable devices */
  @media (hover: hover) and (pointer: fine) {
    .date-input:hover,
 

    .date-input:hover :global(.calendar-icon) {
      opacity: 1;
    }
  }

  .date-input:focus-visible,
  .more-btn:focus-visible,
  .menu-item:focus-visible {
    outline: none;
    background-color: var(--bg-light, #f8f6f0);
  }

  @media (max-width: 768px) {
    .date-input {
      font-size: 0.85rem;
    }
  }
</style>
