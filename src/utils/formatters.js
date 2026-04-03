/**
 * Formats a number to PKR currency string
 * @param {number} n 
 * @returns {string}
 */
export const fmtCurrency = (n) => {
  return 'PKR ' + (n || 0).toLocaleString()
}

/**
 * Formats a date string to a professional shorthand
 * @param {string} dateStr 
 * @returns {string}
 */
export const fmtDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

/**
 * Gets a greeting based on current time
 * @returns {string}
 */
export const getTimeGreeting = () => {
  const hours = new Date().getHours()
  if (hours < 12) return 'Morning'
  if (hours < 18) return 'Afternoon'
  return 'Evening'
}
