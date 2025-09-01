<script>
  import { createEventDispatcher } from 'svelte';
  
  export let value = '';
  export let min = '1989-04-16';
  export let max = '2023-03-12';
  
  const dispatch = createEventDispatcher();
  
  let isOpen = false;
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();
  
  // Parse min/max dates (using date strings to avoid timezone issues)
  const minDate = new Date(min + 'T00:00:00');
  const maxDate = new Date(max + 'T23:59:59');
  
  // Initialize with current value or today's date (within range)
  $: {
    if (value) {
      // Parse date string directly to avoid timezone issues
      const parts = value.split('-');
      currentYear = parseInt(parts[0]);
      currentMonth = parseInt(parts[1]) - 1; // Convert to 0-based month
    } else {
      const today = new Date();
      if (today >= minDate && today <= maxDate) {
        currentYear = today.getFullYear();
        currentMonth = today.getMonth();
      } else {
        currentYear = minDate.getFullYear();
        currentMonth = minDate.getMonth();
      }
    }
  }
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  
  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }
  
  function isDateInRange(year, month, day) {
    // Create date string for comparison to avoid timezone issues
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return dateStr >= min && dateStr <= max;
  }
  
  function isSelectedDate(year, month, day) {
    if (!value) return false;
    // Create date string for comparison to avoid timezone issues
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return value === dateStr;
  }
  
  function selectDate(day) {
    if (!isDateInRange(currentYear, currentMonth, day)) return;
    
    // Create date string manually to avoid timezone issues
    const year = currentYear.toString();
    const month = (currentMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    value = dateString;
    isOpen = false;
    dispatch('change', dateString);
  }
  
  function previousMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
  }
  
  function nextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
  }
  
  function canGoToPreviousMonth() {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const firstDayOfPrevMonth = new Date(prevYear, prevMonth, 1);
    return firstDayOfPrevMonth >= minDate;
  }
  
  function canGoToNextMonth() {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const lastDayOfNextMonth = new Date(nextYear, nextMonth + 1, 0);
    return lastDayOfNextMonth <= maxDate;
  }
  
  function formatDisplayDate(dateString) {
    if (!dateString) return 'Select Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  function togglePicker() {
    isOpen = !isOpen;
  }
  
  function closePicker() {
    isOpen = false;
  }
  
  // Close picker when clicking outside
  function handleOutsideClick(event) {
    if (!event.target.closest('.date-picker')) {
      closePicker();
    }
  }
</script>

<svelte:window on:click={handleOutsideClick} />

<div class="date-picker">
  <button class="date-input" onclick={togglePicker}>
    {formatDisplayDate(value)}
  </button>
  
  {#if isOpen}
    <div class="calendar-popup">
      <div class="calendar-header">
        <button 
          class="nav-btn" 
          onclick={previousMonth}
          disabled={!canGoToPreviousMonth()}
        >
          ◄
        </button>
        <h3 class="month-year">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button 
          class="nav-btn" 
          onclick={nextMonth}
          disabled={!canGoToNextMonth()}
        >
          ►
        </button>
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
              class:selected={selected}
              onclick={() => selectDate(day)}
              disabled={!inRange}
            >
              {day}
            </button>
          {/each}
        </div>
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
    font-size: 14px;
    font-weight: bold;
    color: var(--accent-color, #6d5f4d);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px 12px;
    transition: all 0.2s ease;
    font-family: var(--font-serif, "Times New Roman", Times, serif);
    text-align: center;
    min-width: 200px;
  }
  
  .date-input:hover {
    background-color: var(--bg-light, #f8f6f0);
  }
  
  .date-input:focus {
    outline: none;
    background-color: var(--bg-light, #f8f6f0);
  }
  
  .calendar-popup {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    background: var(--bg-white, #fff);
    border: 2px solid var(--border-color, #8b7d6b);
    box-shadow: var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
    margin-top: 4px;
    padding: 16px;
    min-width: 280px;
  }
  
  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  
  .nav-btn {
    background: var(--bg-white, #fff);
    border: none;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s ease;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .nav-btn:hover:not(:disabled) {
    background: #ebe8e0;
    color: var(--main-color, #333);
  }
  
  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .month-year {
    margin: 0;
    font-size: 16px;
    font-weight: bold;
    color: var(--main-color, #333);
    font-family: var(--font-serif, "Times New Roman", Times, serif);
  }
  
  .calendar-grid {
    font-family: var(--font-serif, "Times New Roman", Times, serif);
  }
  
  .weekday-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: 8px;
  }
  
  .weekday {
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    color: var(--accent-color, #6d5f4d);
    padding: 4px;
  }
  
  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  
  .day {
    width: 32px;
    height: 32px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    font-weight: normal;
    color: var(--main-color, #333);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .day:hover:not(.disabled):not(.empty) {
    background: var(--bg-light, #f8f6f0);
    border-color: var(--border-color, #8b7d6b);
  }
  
  .day.selected {
    background: var(--accent-color, #6d5f4d);
    color: white;
    font-weight: bold;
  }
  
  .day.disabled {
    color: #ccc;
    cursor: not-allowed;
  }
  
  .day.empty {
    cursor: default;
  }
  
  @media (max-width: 600px) {
    .date-input {
      min-width: 180px;
      font-size: 13px;
    }
    
    .calendar-popup {
      min-width: 260px;
      padding: 12px;
    }
    
    .month-year {
      font-size: 14px;
    }
  }
</style>
