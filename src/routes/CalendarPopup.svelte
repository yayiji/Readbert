<script>
  import { createEventDispatcher } from "svelte";

  let {
    value = "",
    min = "1989-04-16",
    max = "2023-03-12",
  } = $props();

  const dispatch = createEventDispatcher();

  let currentYear = $state(new Date().getFullYear());
  let currentMonth = $state(new Date().getMonth());
  let tempValue = $state("");

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

  const minDate = $derived(new Date(`${min}T00:00:00`));
  const maxDate = $derived(new Date(`${max}T23:59:59`));

  $effect(() => {
    if (value) {
      const [year, month] = value.split("-");
      currentYear = parseInt(year);
      currentMonth = parseInt(month) - 1;
    } else {
      const today = new Date();
      const targetDate = today >= minDate && today <= maxDate ? today : minDate;
      currentYear = targetDate.getFullYear();
      currentMonth = targetDate.getMonth();
    }
    tempValue = "";
  });

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
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
    if (!tempValue) return;
    dispatch("confirm", { value: tempValue });
  }

  function cancelSelection() {
    dispatch("cancel");
  }

  function clearTempSelection() {
    tempValue = "";
  }

  function previousYear() {
    currentYear--;
    clearTempSelection();
  }

  function nextYear() {
    currentYear++;
    clearTempSelection();
  }

  function selectMonth(monthIndex) {
    currentMonth = monthIndex;
    clearTempSelection();
  }

  const canGoToPreviousYear = () => currentYear > minDate.getFullYear();
  const canGoToNextYear = () => currentYear < maxDate.getFullYear();
</script>

<div class="calendar-popup">
  <div class="calendar-header">

    <button
      class="nav-btn"
      onclick={previousYear}
      disabled={!canGoToPreviousYear()}
      title="Previous Year"
      type="button"
    >
      ◄
    </button>
    <h3 class="month-year">
      {currentYear}
    </h3>
    <button
      class="nav-btn"
      onclick={nextYear}
      disabled={!canGoToNextYear()}
      title="Next Year"
      type="button"
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
            type="button"
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
          type="button"
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

<style>
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
    font-size: 14px;
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
    font-size: 17px;
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
    font-size: 14px;
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
    font-size: 14px;
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
    font-size: 15px;
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
</style>
