<script>
  import { CalendarDays } from "@lucide/svelte";
  import CalendarPopup from "./CalendarPopup.svelte";

  let { selectedDate = $bindable("") } = $props();

  let isOpen = $state(false);

  function formatDisplayDate(dateString) {
    return dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Select Date";
  }

  const togglePicker = () => (isOpen = !isOpen);

  function closePicker() {
    isOpen = false;
  }

  function handleConfirm(event) {
    const value = event.detail?.value;
    if (value) {
      selectedDate = value;
    }
    closePicker();
  }

  function handleOutsideClick(event) {
    if (!event.target.closest(".date-picker")) closePicker();
  }

  function handleKeydown(event) {
    if (event.key === "Escape" && isOpen) closePicker();
  }
</script>

<svelte:window onclick={handleOutsideClick} onkeydown={handleKeydown} />

<div class="date-picker">
  <button
    class="date-input"
    onclick={togglePicker}
    aria-expanded={isOpen}
    aria-label="Select date"
    type="button"
  >
    <CalendarDays class="calendar-icon" size={16} />
    <span class="date-text">{formatDisplayDate(selectedDate)}</span>
  </button>

  {#if isOpen}
    <CalendarPopup value={selectedDate} on:confirm={handleConfirm} on:cancel={closePicker} />
  {/if}
</div>

<style>
  .date-picker {
    position: relative;
    display: inline-block;
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
    letter-spacing: 0.5px;
    padding: 0 0.5rem;
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

  @media (hover: hover) and (pointer: fine) {
    .date-input:hover {
      background-color: var(--bg-light, #f8f6f0);
    }

    .date-input:hover :global(.calendar-icon) {
      opacity: 1;
    }
  }

  .date-input:focus-visible {
    outline: none;
    background-color: var(--bg-light, #f8f6f0);
  }
</style>
