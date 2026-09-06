<script>
  import { createEventDispatcher } from "svelte";
  import { getFirstComicDate, getLastComicDate } from "$lib/dateUtils.js";

  let { value = "" } = $props();

  const MIN_DATE = getFirstComicDate();
  const MAX_DATE = getLastComicDate();
  const MIN_YEAR = Number(MIN_DATE.slice(0, 4));
  const MAX_YEAR = Number(MAX_DATE.slice(0, 4));
  const minDate = new Date(`${MIN_DATE}T00:00:00`);
  const maxDate = new Date(`${MAX_DATE}T23:59:59`);
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const months = [
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
  ].map((label, index) => ({ label, index }));
  const monthRows = [months.slice(0, 6), months.slice(6)];
  const years = Array.from(
    { length: MAX_YEAR - MIN_YEAR + 1 },
    (_, index) => MIN_YEAR + index,
  );

  const dispatch = createEventDispatcher();

  let currentYear = $state(MIN_YEAR);
  let currentMonth = $state(minDate.getMonth());
  let tempValue = $state("");
  let yearScroller = $state();
  let didInitialYearJump = false;

  const selectedDate = $derived(tempValue || value);
  const leadingBlankDays = $derived(
    Array.from({ length: getFirstDayOfMonth(currentYear, currentMonth) }),
  );
  const visibleDays = $derived(
    Array.from(
      { length: getDaysInMonth(currentYear, currentMonth) },
      (_, index) => index + 1,
    ),
  );

  function getViewDate(dateString) {
    if (dateString) {
      const [year, month] = dateString.split("-").map(Number);
      return new Date(year, month - 1, 1);
    }

    const today = new Date();
    return today >= minDate && today <= maxDate ? today : minDate;
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function formatDateString(year, month, day) {
    return `${year}-${(month + 1).toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
  }

  function isDateInRange(year, month, day) {
    const dateStr = formatDateString(year, month, day);
    return dateStr >= MIN_DATE && dateStr <= MAX_DATE;
  }

  function isSelectedDate(year, month, day) {
    const dateStr = formatDateString(year, month, day);
    return selectedDate === dateStr;
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

  function selectYear(year) {
    if (year < MIN_YEAR || year > MAX_YEAR) return;
    centerYear(year, "smooth");

    if (year !== currentYear) {
      currentYear = year;
      clearTempSelection();
    }
  }

  function selectMonth(monthIndex) {
    currentMonth = monthIndex;
    clearTempSelection();
  }

  function centerYear(year, behavior = "auto") {
    if (!yearScroller) return;

    const yearButton = yearScroller.querySelector(`[data-year="${year}"]`);
    if (!yearButton) return;

    const scrollerRect = yearScroller.getBoundingClientRect();
    const buttonRect = yearButton.getBoundingClientRect();
    const buttonCenter =
      buttonRect.left - scrollerRect.left + yearScroller.scrollLeft + buttonRect.width / 2;

    yearScroller.scrollTo({
      left: buttonCenter - yearScroller.clientWidth / 2,
      behavior,
    });
  }

  function centerYearOnce() {
    if (didInitialYearJump) return;

    centerYear(currentYear);
    didInitialYearJump = true;
  }

  function handleYearWheel(event) {
    if (!yearScroller) return;

    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
      return;
    }

    const rawDelta = event.deltaY;
    if (!rawDelta) return;

    const unit = event.deltaMode === 1
      ? 16
      : event.deltaMode === 2
        ? yearScroller.clientWidth
        : 1;

    event.preventDefault();
    yearScroller.scrollLeft += rawDelta * unit;
  }

  $effect(() => {
    const viewDate = getViewDate(value);
    currentYear = viewDate.getFullYear();
    currentMonth = viewDate.getMonth();
    tempValue = "";
  });

  $effect(() => {
    if (!yearScroller) return;
    const timer = setTimeout(centerYearOnce, 0);
    return () => clearTimeout(timer);
  });

  $effect(() => {
    if (!yearScroller) return;
    yearScroller.addEventListener("wheel", handleYearWheel, { passive: false });
    return () => yearScroller.removeEventListener("wheel", handleYearWheel);
  });
</script>

<div class="calendar-popup">
  <div class="year-selection" aria-label="Select year">
    <div
      class="year-scroller"
      bind:this={yearScroller}
      role="listbox"
      aria-label="Year carousel"
    >
      {#each years as year}
        <button
          class="year-btn"
          class:selected={year === currentYear}
          data-year={year}
          onclick={() => selectYear(year)}
          type="button"
          role="option"
          aria-selected={year === currentYear}
        >
          {year}
        </button>
      {/each}
    </div>
  </div>

  <div class="month-selection">
    {#each monthRows as monthRow}
      <div class="month-row">
        {#each monthRow as month}
          <button
            class="month-btn"
            class:selected={month.index === currentMonth}
            onclick={() => selectMonth(month.index)}
            type="button"
          >
            {month.label}
          </button>
        {/each}
      </div>
    {/each}
  </div>

  <div class="calendar-grid">
    <div class="weekday-headers">
      {#each weekdays as weekday}
        <div class="weekday">{weekday}</div>
      {/each}
    </div>

    <div class="days-grid">
      {#each leadingBlankDays as _}
        <div class="day empty"></div>
      {/each}

      {#each visibleDays as day}
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
    border-radius: 18px;
    background: var(--color-glass);
    border: 3px solid var(--color-border-medium);
    box-shadow: var(--shadow);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    margin-top: 0px;
    padding: 1.5rem 1.5rem;
  }

  .year-btn,
  .month-btn,
  .day,
  .action-btn {
    background: var(--color-transparent);
    border: 1px solid var(--color-transparent);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
    display: flex;
    color: var(--color-text);
    align-items: center;
    justify-content: center;
  }

  .year-selection {
    position: relative;
    --carousel-width: 290px;
    --year-width: 4rem;
    --year-gap: 0.5rem;
    width: var(--carousel-width);
    margin-bottom: 16px;
    isolation: isolate;
  }

  .year-selection::before,
  .year-selection::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 28px;
    z-index: 2;
    pointer-events: none;
  }

  .year-selection::before {
    left: 0;
    background: linear-gradient(
      90deg,
      var(--color-glass-strong),
      var(--color-transparent)
    );
  }

  .year-selection::after {
    right: 0;
    background: linear-gradient(
      270deg,
      var(--color-glass-strong),
      var(--color-transparent)
    );
  }

  .year-scroller {
    position: relative;
    z-index: 1;
    display: flex;
    gap: var(--year-gap);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-padding-inline: calc((var(--carousel-width) - var(--year-width)) / 2);
    scrollbar-width: none;
    padding: 0.3rem calc((var(--carousel-width) - var(--year-width)) / 2) 0.4rem;
    touch-action: pan-x;
    -webkit-overflow-scrolling: touch;
  }

  .year-scroller::-webkit-scrollbar {
    display: none;
  }

  .year-btn {
    flex: 0 0 auto;
    width: var(--year-width);
    height: 2.2rem;
    padding: 0;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  .year-btn.selected {
    background: var(--color-accent);
    color: var(--color-surface-strong);
    font-weight: bold;
    border-color: var(--color-accent);
    z-index: 2;
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
    background-color: var(--color-border-light);
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
    color: var(--color-text);
    width: 42px;
    height: 30px;
    letter-spacing: 1px;
  }

  .month-btn.selected {
    background: var(--color-accent);
    color: var(--color-surface-strong);
    font-weight: bold;
    border-color: var(--color-accent);
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
    color: var(--color-text);
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
    color: var(--color-text);
    margin: 0;
    padding: 0;
  }

  .day.selected {
    background: var(--color-accent);
    color: var(--color-surface-strong);
    font-weight: bold;
    border-color: var(--color-accent);
  }

  .day.disabled {
    color: var(--color-muted);
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
    color: var(--color-text);
    font-weight: bold;
  }

  .confirm-btn {
    color: var(--color-text);
    font-weight: bold;
  }

  .confirm-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: var(--color-muted);
    font-weight: normal;
  }

  @media (hover: hover) and (pointer: fine) {
    .year-btn:hover:not(.selected),
    .month-btn:hover,
    .day:hover:not(.disabled):not(.empty),
    .action-btn:hover:not(:disabled) {
      background: var(--color-surface);
      border-color: var(--color-border);
      font-weight: bold;
      color: var(--color-text);
    }
  }
</style>
