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

  function handleTriggerKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePicker();
    }
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
  <div
    class="date-input"
    onclick={togglePicker}
    onkeydown={handleTriggerKeydown}
    aria-expanded={isOpen}
    aria-label="Select date"
    role="button"
    tabindex="0"
  >
    <CalendarDays class="calendar-icon" size={17} />
    <span class="date-text">{formatDisplayDate(selectedDate)}</span>
  </div>

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
    color: var(--color-ink);
    background: var(--color-transparent);
    border: none;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: bold;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 0rem 0rem;
    transition: all 0.2s ease;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
  }

  .date-input :global(.calendar-icon) {
    opacity: 1;
    transform: translateY(-1px);
  }

  @media (hover: hover) and (pointer: fine) {
    .date-input:hover {
      background-color: var(--color-paper-light);
    }

    .date-input:hover :global(.calendar-icon) {
      opacity: 1;
    }
  }

  .date-input:focus-visible {
    outline: none;
    background-color: var(--color-paper-light);
  }

</style>
