<script>
  let { value = $bindable(''), min = '1989-04-16', max = '2023-03-12' } = $props();
  
  let isOpen = $state(false);
  let currentYear = $state(new Date().getFullYear());
  let currentMonth = $state(new Date().getMonth());
  
  // Parse min/max dates
  const minDate = new Date(min + 'T00:00:00');
  const maxDate = new Date(max + 'T23:59:59');
  
  // Initialize with current value or today's date (within range)
  $effect(() => {
    if (value) {
      const parts = value.split('-');
      currentYear = parseInt(parts[0]);
      currentMonth = parseInt(parts[1]) - 1;
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
  });
  
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
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return dateStr >= min && dateStr <= max;
  }
  
  function isSelectedDate(year, month, day) {
    if (!value) return false;
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return value === dateStr;
  }
  
  function selectDate(day) {
    if (!isDateInRange(currentYear, currentMonth, day)) return;
    
    const year = currentYear.toString();
    const month = (currentMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    value = dateString;
    isOpen = false;
  }
  
  function previousMonth() {
    currentYear--;
  }
  
  function nextMonth() {
    currentYear++;
  }
  
  function canGoToPreviousMonth() {
    const minYear = minDate.getFullYear();
    return currentYear > minYear;
  }
  
  function canGoToNextMonth() {
    const maxYear = maxDate.getFullYear();
    return currentYear < maxYear;
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
  
  function handleOutsideClick(event) {
    if (!event.target.closest('.date-picker')) {
      closePicker();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen) {
      closePicker();
    }
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
    {formatDisplayDate(value)}
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
        <div class="month-row">
          {#each Array(6) as _, index}
            <button 
              class="month-btn"
              class:selected={index === currentMonth}
              onclick={() => currentMonth = index}
            >
              {(index + 1).toString().padStart(2, '0')}
            </button>
          {/each}
        </div>
        <div class="month-row">
          {#each Array(6) as _, index}
            <button 
              class="month-btn"
              class:selected={index + 6 === currentMonth}
              onclick={() => currentMonth = index + 6}
            >
              {(index + 7).toString().padStart(2, '0')}
            </button>
          {/each}
        </div>
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
              {day.toString().padStart(2, '0')}
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
    font-size: 16px;
    transition: all 0.2s ease;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
  }
  
  .nav-btn:hover:not(:disabled) {
    background: var(--bg-light, #f8f6f0);
    border-color: var(--accent-color, #6d5f4d);
  }
  
  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .month-selection {
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border-color, #8b7d6b);
    padding-bottom: 12px;
  }
  
  .month-row {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
    justify-content: space-between;
  }
  
  .month-row:last-child {
    margin-bottom: 0;
  }
  
  .month-btn {
    background: transparent;
    border: 1px solid transparent;
    padding: 0;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: var(--main-color, #333);
    transition: all 0.2s ease;
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .month-btn:hover {
    background: var(--bg-light, #f8f6f0);
    border-color: var(--border-color, #8b7d6b);
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
    color: var(--main-color, #333);
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
  }
  
  .calendar-grid {
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
  }
  
  .weekday-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;
  }
  
  .weekday {
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    color: var(--accent-color, #6d5f4d);
    padding: 8px 4px;
  }
  
  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  
  .day {
    width: 40px;
    height: 40px;
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
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
  }
  
  .day:hover:not(.disabled):not(.empty) {
    background: var(--bg-light, #f8f6f0);
    border-color: var(--border-color, #8b7d6b);
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
</style>
