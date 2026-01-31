/**
 * Date formatter utility to handle ISO-8601 date strings from MongoDB/Java
 * Prevents "Invalid Date" errors and provides consistent formatting
 */

export const formatDate = (dateString, locale = 'en-IN') => {
  if (!dateString) return "Date not set";
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    
    // Format as localized date string
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return "Invalid Date";
  }
};

export const formatDateTime = (dateString, locale = 'en-IN') => {
  if (!dateString) return "Date/Time not set";
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    
    // Format as localized date and time
    const dateFormatted = date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    const timeFormatted = date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateFormatted} ${timeFormatted}`;
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return "Invalid Date";
  }
};

export const formatJoinedDate = (dateString) => {
  if (!dateString) return "Date not available";
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return "Date not available";
    }
    
    // Return "Joined in Month Year" format
    const monthYear = date.toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    });
    
    return `Joined in ${monthYear}`;
  } catch (error) {
    console.error('Joined date formatting error:', error);
    return "Date not available";
  }
};

export default {
  formatDate,
  formatDateTime,
  formatJoinedDate
};
