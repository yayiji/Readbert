<script>
  import { Calendar, CalendarDays } from "@lucide/svelte";

  let {
    value = $bindable(""),
    min = "1989-04-16",
    max = "2023-03-12",
  } = $props();

  let isOpen = $state(false);
  let currentYear = $state(new Date().getFullYear());
  let currentMonth = $state(new Date().getMonth());
  let tempValue = $state(""); // Store temporary selection before confirmation

  // Parse min/max dates
  const minDate = new Date(min + "T00:00:00");
  const maxDate = new Date(max + "T23:59:59");

  const monthAbbrevs = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  // Initialize with current value or today's date (within range)
  $effect(() => {
    if (value) {
      const parts = value.split("-");
      currentYear = parseInt(parts[0]);
      currentMonth = parseInt(parts[1]) - 1;
    } else {
      const today = new Date();
      const targetDate = today >= minDate && today <= maxDate ? today : minDate;
      currentYear = targetDate.getFullYear();
      currentMonth = targetDate.getMonth();
    }
  });

  // Utility functions
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const formatDateString = (year, month, day) =>
    `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

  function isDateInRange(year, month, day) {
    const dateStr = formatDateString(year, month, day);
    return dateStr >= min && dateStr <= max;
  }

  function isSelectedDate(year, month, day) {
    const dateStr = formatDateString(year, month, day);
    return tempValue ? tempValue === dateStr : value === dateStr;
  }

  function selectDate(day) {
    if (!isDateInRange(currentYear, currentMonth, day)) return;
    tempValue = formatDateString(currentYear, currentMonth, day);
  }

  function confirmSelection() {
    if (tempValue) value = tempValue;
    closePicker();
  }

  function cancelSelection() {
    closePicker();
  }

  function clearTempSelection() {
    tempValue = "";
  }

  function previousMonth() {
    currentYear--;
    clearTempSelection();
  }

  function nextMonth() {
    currentYear++;
    clearTempSelection();
  }

  function selectMonth(monthIndex) {
    currentMonth = monthIndex;
    clearTempSelection();
  }

  const canGoToPreviousMonth = () => currentYear > minDate.getFullYear();
  const canGoToNextMonth = () => currentYear < maxDate.getFullYear();

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
    tempValue = "";
    isOpen = false;
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
  >
    <span class="date-text">{formatDisplayDate(value)}</span>
    <CalendarDays class="calendar-icon" size={15} />
  </button>

  {#if isOpen}
    <div class="calendar-popup">
      <div class="calendar-header">
        <button
          class="nav-btn"
          onclick={previousMonth}
          disabled={!canGoToPreviousMonth()}
          title="Previous Year"
        >
          ◄
        </button>
        <h3 class="month-year">
          {currentYear}
        </h3>
        <button
          class="nav-btn"
          onclick={nextMonth}
          disabled={!canGoToNextMonth()}
          title="Next Year"
        >
          ►
        </button>
      </div>

      <div class="month-selection">
        {#each [0, 1] as rowIndex}
          <div class="month-row">
            {#each Array(6) as _, colIndex}
              {@const monthIndex = rowIndex * 6 + colIndex}
              <button
                class="month-btn"
                class:selected={monthIndex === currentMonth}
                onclick={() => selectMonth(monthIndex)}
              >
                {monthAbbrevs[monthIndex]}
              </button>
            {/each}
          </div>
        {/each}
      </div>

      <div class="calendar-grid">
        <div class="weekday-headers">
          <div class="weekday">Su</div>
          <div class="weekday">Mo</div>
          <div class="weekday">Tu</div>
          <div class="weekday">We</div>
          <div class="weekday">Th</div>
          <div class="weekday">Fr</div>
          <div class="weekday">Sa</div>
        </div>

        <div class="days-grid">
          {#each Array(getFirstDayOfMonth(currentYear, currentMonth)) as _}
            <div class="day empty"></div>
          {/each}

          {#each Array(getDaysInMonth(currentYear, currentMonth)) as _, i}
            {@const day = i + 1}
            {@const inRange = isDateInRange(currentYear, currentMonth, day)}
            {@const selected = isSelectedDate(currentYear, currentMonth, day)}
            <button
              class="day"
              class:disabled={!inRange}
              class:selected
              onclick={() => selectDate(day)}
              disabled={!inRange}
            >
              {day.toString().padStart(2, "0")}
            </button>
          {/each}
        </div>
      </div>

      <div class="calendar-actions">
        <button
          class="action-btn cancel-btn"
          onclick={cancelSelection}
          type="button"
        >
          Cancel
        </button>
        <button
          class="action-btn confirm-btn"
          onclick={confirmSelection}
          type="button"
          disabled={!tempValue}
        >
          Confirm
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .date-picker {
    position: relative;
    display: inline-block;
  }

  .date-input {
    color: var(--accent-color, #6d5f4d);
    background: transparent;
    border: none;
    font-family: var(--font-serif);
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 0px 8px;
    transition: all 0.2s ease;
    text-align: center;
    min-width: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .date-text {
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
  }

  .date-input :global(.calendar-icon) {
    flex-shrink: 0;
    opacity: 0.8;
    transition: opacity 0.2s ease;
    transform: translateY(-0.5px);
    width: 15px;
    height: 15px;
  }

  /* Hover feedback only for hover-capable devices */
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

  .calendar-popup {
    position: fixed;
    top: 16%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    border-radius: 0px;
    background: rgba(248, 246, 240, 0.8);
    border: 3px solid rgba(139, 125, 107, 0.4);
    box-shadow: var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    margin-top: 0px;
    padding: 25px 25px 25px;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  /* Common button styles */
  .nav-btn,
  .month-btn,
  .day,
  .action-btn {
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
    display: flex;
    color: var(--text-color);
    align-items: center;
    justify-content: center;
  }

  .nav-btn {
    /* background: transparent;
    border: none; */
    /* padding: 4px 4px; */
    font-size: 16px;
    width: 36px;
    height: 36px;
    color: var(--text-color);
    -webkit-appearance: none;
    appearance: none;
    border-radius: 0;
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .month-selection {
    margin-bottom: 10px;
    padding-bottom: 30px;
    position: relative;
  }

  .month-selection::after {
    content: "";
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    height: 0.5px;
    background-color: rgba(139, 125, 107, 0.3);
  }

  .month-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    justify-content: space-between;
  }

  .month-row:last-child {
    margin-bottom: 0;
  }

  .month-btn {
    padding: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
    width: 42px;
    height: 30px;
    letter-spacing: 1px;
  }

  .month-btn.selected {
    background: var(--accent-color, #6d5f4d);
    color: white;
    font-weight: bold;
    border-color: var(--accent-color, #6d5f4d);
  }

  .month-year {
    margin: 0;
    font-size: 16px;
    font-weight: bold;
    color: var(--text-color);
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
  }

  .calendar-grid {
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
  }

  .weekday-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: 4px;
  }

  .weekday {
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    color: var(--text-color);
    width: 40px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  .day {
    width: 40px;
    height: 40px;
    font-size: 13px;
    font-weight: normal;
    color: var(--text-color);
    margin: 0;
    padding: 0;
  }

  .day.selected {
    background: var(--accent-color, #6d5f4d);
    color: white;
    font-weight: bold;
    border-color: var(--accent-color, #6d5f4d);
  }

  .day.disabled {
    color: #ccc;
    cursor: not-allowed;
  }

  .day.empty {
    cursor: default;
  }

  .calendar-actions {
    display: flex;
    gap: 12px;
    justify-content: space-between;
    margin-top: 4px;
    padding-top: 16px;
  }

  .action-btn {
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    min-width: 80px;
    height: 36px;
  }

  .cancel-btn {
    color: var(--text-color);
    font-weight: bold;
  }

  .confirm-btn {
    color: var(--text-color);
    font-weight: bold;
  }

  .confirm-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: #ccc;
    font-weight: normal;
  }

  /* Hover styles */
  @media (hover: hover) and (pointer: fine) {
    .nav-btn:hover:not(:disabled),
    .month-btn:hover,
    .day:hover:not(.disabled):not(.empty),
    .action-btn:hover:not(:disabled) {
      background: var(--bg-light, #f8f6f0);
      border-color: var(--border-color, #8b7d6b);
      font-weight: bold;
      color: var(--text-color);
    }
  }

  @media (max-width: 600px) {
    .date-input {
      font-size: 12px;
    }

    .date-input :global(.calendar-icon) {
      width: 14px;
      height: 14px;
    }

    .calendar-actions {
      gap: 8px;
    }

    .action-btn {
      font-size: 11px;
      padding: 6px 12px;
      min-width: 70px;
      height: 32px;
    }
  }
</style>
