<script>
  import { createEventDispatcher } from 'svelte';
  
  export let value = '';
  export let min = '1989-04-16';
  export let max = '2023-03-12';
  
  const dispatch = createEventDispatcher();
  
  let isOpen = false;
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();
  let calendarElement;
  let isMobile = false;
  let touchStartX = 0;
  let touchStartY = 0;
  
  // Parse min/max dates (using date strings to avoid timezone issues)
  const minDate = new Date(min + 'T00:00:00');
  const maxDate = new Date(max + 'T23:59:59');
  
  // Check if device is mobile/small screen
  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    }
  }
  
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
    currentYear--;
  }
  
  function nextMonth() {
    currentYear++;
  }
  
  function canGoToPreviousMonth() {
    const prevYear = currentYear - 1;
    const firstDayOfPrevYear = new Date(prevYear, 0, 1);
    return firstDayOfPrevYear >= minDate;
  }
  
  function canGoToNextMonth() {
    const nextYear = currentYear + 1;
    const lastDayOfNextYear = new Date(nextYear, 11, 31);
    return lastDayOfNextYear <= maxDate;
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
    if (isOpen) {
      checkMobile();
      // Prevent body scroll on mobile when picker is open
      if (isMobile && typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden';
      }
    } else if (isMobile && typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
  
  function closePicker() {
    isOpen = false;
    if (isMobile && typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
  
  // Close picker when clicking outside
  function handleOutsideClick(event) {
    if (!event.target.closest('.date-picker')) {
      closePicker();
    }
  }

  // Handle escape key to close picker
  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen) {
      closePicker();
    }
  }

  // Handle window resize
  function handleResize() {
    checkMobile();
  }

  // Touch/swipe handling for mobile
  function handleTouchStart(event) {
    if (!isMobile) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchEnd(event) {
    if (!isMobile) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && canGoToPreviousMonth()) {
        previousMonth();
      } else if (deltaX < 0 && canGoToNextMonth()) {
        nextMonth();
      }
    }
  }

  // Initialize mobile check on mount
  if (typeof window !== 'undefined') {
    checkMobile();
  }
</script>

<svelte:window on:click={handleOutsideClick} on:keydown={handleKeydown} on:resize={handleResize} />

<div class="date-picker">
  <button 
    class="date-input" 
    onclick={togglePicker}
    aria-expanded={isOpen}
    aria-haspopup="dialog"
    aria-label="Select date"
  >
    {formatDisplayDate(value)}
  </button>
  
  {#if isOpen}
    <!-- Mobile overlay backdrop -->
    {#if isMobile}
      <div 
        class="mobile-backdrop" 
        onclick={closePicker}
        onkeydown={(e) => e.key === 'Enter' && closePicker()}
        role="button"
        tabindex="0"
        aria-label="Close date picker"
      ></div>
    {/if}
    
    <div 
      class="calendar-popup" 
      class:mobile={isMobile}
      bind:this={calendarElement}
      role="dialog"
      aria-label="Date picker"
      ontouchstart={handleTouchStart}
      ontouchend={handleTouchEnd}
    >
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
      
      <!-- Month selection grid -->
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
    touch-action: manipulation; /* Prevents zoom on iOS */
  }
  
  .date-input:hover {
    background-color: var(--bg-light, #f8f6f0);
  }
  
  .date-input:focus {
    outline: none;
    background-color: var(--bg-light, #f8f6f0);
  }

  .mobile-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    cursor: pointer;
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

  .calendar-popup.mobile {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 400px;
    max-height: 90vh;
    overflow-y: auto;
    margin: 0;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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
    touch-action: manipulation;
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
    touch-action: manipulation;
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
    touch-action: manipulation;
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
  
  /* Mobile-specific improvements */
  @media (max-width: 768px) {
    .date-input {
      min-width: 160px;
      font-size: 16px; /* Prevents zoom on iOS */
      padding: 12px 16px;
    }
    
    .calendar-popup:not(.mobile) {
      min-width: 320px;
      padding: 16px;
      /* Ensure popup doesn't go off screen */
      left: auto;
      right: 0;
      transform: none;
    }

    .nav-btn {
      width: 44px;
      height: 44px;
      font-size: 18px;
    }

    .month-btn {
      width: 44px;
      height: 44px;
      font-size: 14px;
    }

    .day {
      width: 44px;
      height: 44px;
      font-size: 14px;
    }

    .weekday {
      padding: 8px 2px;
      font-size: 11px;
    }

    .month-year {
      font-size: 18px;
    }

    .month-row {
      gap: 2px;
    }

    .days-grid {
      gap: 2px;
    }

    .weekday-headers {
      gap: 2px;
    }
  }

  /* Very small screens */
  @media (max-width: 480px) {
    .date-input {
      min-width: 140px;
      font-size: 16px;
      padding: 10px 12px;
    }

    .calendar-popup.mobile {
      width: 95vw;
      padding: 12px;
    }

    .nav-btn {
      width: 40px;
      height: 40px;
    }

    .month-btn {
      width: 38px;
      height: 38px;
      font-size: 13px;
    }

    .day {
      width: 38px;
      height: 38px;
      font-size: 13px;
    }

    .month-year {
      font-size: 16px;
    }
  }

  /* Landscape orientation on mobile */
  @media (max-height: 500px) and (orientation: landscape) {
    .calendar-popup.mobile {
      max-height: 95vh;
      width: 80vw;
      max-width: 500px;
    }

    .nav-btn, .month-btn, .day {
      width: 36px;
      height: 36px;
    }
  }

  /* High DPI displays */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .nav-btn, .month-btn, .day {
      border-width: 0.5px;
    }
  }

  /* Focus styles for better accessibility */
  .date-input:focus-visible,
  .nav-btn:focus-visible,
  .month-btn:focus-visible,
  .day:focus-visible {
    outline: 2px solid var(--accent-color, #6d5f4d);
    outline-offset: 2px;
  }

  /* Reduce motion for users who prefer it */
  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
    }
  }
</style>
