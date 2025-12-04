import {
  format,
  isSameYear,
  fromUnixTime,
  formatDistanceToNow,
  differenceInDays,
} from 'date-fns';

// 上海时区常量
const SHANGHAI_TIMEZONE = 'Asia/Shanghai';

/**
 * 将时间转换为上海时区的格式化字符串
 * @param {Date} date - 日期对象
 * @param {Object} options - Intl.DateTimeFormat 选项
 * @returns {string} 格式化的时间字符串
 */
const formatToShanghai = (date, options = {}) => {
  return date.toLocaleString('en-US', {
    timeZone: SHANGHAI_TIMEZONE,
    ...options,
  });
};

/**
 * 获取上海时区的小时和分钟
 * @param {Date} date - 日期对象
 * @returns {string} 格式如 "3:45 PM"
 */
const getShanghaiTime = (date) => {
  return date.toLocaleString('en-US', {
    timeZone: SHANGHAI_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * 获取上海时区的日期
 * @param {Date} date - 日期对象
 * @param {boolean} includeYear - 是否包含年份
 * @returns {string} 格式如 "Dec 4, 2025"
 */
const getShanghaiDate = (date, includeYear = false) => {
  const options = {
    timeZone: SHANGHAI_TIMEZONE,
    month: 'short',
    day: 'numeric',
  };
  if (includeYear) {
    options.year = 'numeric';
  }
  return date.toLocaleString('en-US', options);
};

/**
 * Formats a Unix timestamp into a human-readable time format (上海时区).
 * @param {number} time - Unix timestamp.
 * @param {string} [dateFormat='h:mm a'] - Desired format of the time.
 * @returns {string} Formatted time string in Shanghai timezone.
 */
export const messageStamp = (time, dateFormat = 'h:mm a') => {
  const unixTime = fromUnixTime(time);

  // 强制使用上海时区
  // dateFormat 参数在这里被忽略，统一使用上海时区格式
  return getShanghaiTime(unixTime);
};

/**
 * Provides a formatted timestamp, adjusting the format based on the current year (上海时区).
 * @param {number} time - Unix timestamp.
 * @param {string} [dateFormat='MMM d, yyyy'] - Desired date format.
 * @returns {string} Formatted date string in Shanghai timezone.
 */
export const messageTimestamp = (time, dateFormat = 'MMM d, yyyy') => {
  const unixTime = fromUnixTime(time);
  const now = new Date();

  // 获取上海时区的年份进行比较
  const messageYear = parseInt(formatToShanghai(unixTime, { year: 'numeric' }), 10);
  const currentYear = parseInt(formatToShanghai(now, { year: 'numeric' }), 10);

  if (messageYear !== currentYear) {
    // 不同年份，显示完整日期和时间
    return unixTime.toLocaleString('en-US', {
      timeZone: SHANGHAI_TIMEZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // 同一年，只显示月日
  return getShanghaiDate(unixTime, false);
};

/**
 * Converts a Unix timestamp to a relative time string (e.g., 3 hours ago).
 * @param {number} time - Unix timestamp.
 * @returns {string} Relative time string.
 */
export const dynamicTime = time => {
  const unixTime = fromUnixTime(time);
  return formatDistanceToNow(unixTime, { addSuffix: true });
};

/**
 * Formats a Unix timestamp into a specified date format (上海时区).
 * @param {number} time - Unix timestamp.
 * @param {string} [dateFormat='MMM d, yyyy'] - Desired date format.
 * @returns {string} Formatted date string in Shanghai timezone.
 */
export const dateFormat = (time, df = 'MMM d, yyyy') => {
  const unixTime = fromUnixTime(time);
  return getShanghaiDate(unixTime, true);
};

/**
 * Converts a detailed time description into a shorter format, optionally appending 'ago'.
 * @param {string} time - Detailed time description (e.g., 'a minute ago').
 * @param {boolean} [withAgo=false] - Whether to append 'ago' to the result.
 * @returns {string} Shortened time description.
 */
export const shortTimestamp = (time, withAgo = false) => {
  const suffix = withAgo ? ' ago' : '';
  const timeMappings = {
    'less than a minute ago': 'now',
    'a minute ago': `1m${suffix}`,
    'an hour ago': `1h${suffix}`,
    'a day ago': `1d${suffix}`,
    'a month ago': `1mo${suffix}`,
    'a year ago': `1y${suffix}`,
  };
  if (timeMappings[time]) {
    return timeMappings[time];
  }
  const convertToShortTime = time
    .replace(/about|over|almost|/g, '')
    .replace(' minute ago', `m${suffix}`)
    .replace(' minutes ago', `m${suffix}`)
    .replace(' hour ago', `h${suffix}`)
    .replace(' hours ago', `h${suffix}`)
    .replace(' day ago', `d${suffix}`)
    .replace(' days ago', `d${suffix}`)
    .replace(' month ago', `mo${suffix}`)
    .replace(' months ago', `mo${suffix}`)
    .replace(' year ago', `y${suffix}`)
    .replace(' years ago', `y${suffix}`);
  return convertToShortTime;
};

/**
 * Calculates the difference in days between now and a given timestamp.
 * @param {Date} now - Current date/time.
 * @param {number} timestampInSeconds - Unix timestamp in seconds.
 * @returns {number} Number of days difference.
 */
export const getDayDifferenceFromNow = (now, timestampInSeconds) => {
  const date = new Date(timestampInSeconds * 1000);
  return differenceInDays(now, date);
};

/**
 * Checks if more than 24 hours have passed since a given timestamp.
 * @param {number} timestamp - Unix timestamp.
 * @returns {boolean} True if more than 24 hours have passed.
 */
export const hasOneDayPassed = timestamp => {
  if (!timestamp) return true;
  return getDayDifferenceFromNow(new Date(), timestamp) >= 1;
};

/**
 * 将任意日期转换为上海时区显示（完整格式）
 * @param {Date|string|number} date - 日期对象、ISO字符串或时间戳
 * @returns {string} 上海时区格式化的时间字符串
 */
export const formatDateToShanghai = (date) => {
  if (!date) return '';
  let dateObj;
  if (typeof date === 'number') {
    // 如果是秒级时间戳（小于 10000000000）
    dateObj = date < 10000000000 ? fromUnixTime(date) : new Date(date);
  } else {
    dateObj = new Date(date);
  }
  return dateObj.toLocaleString('zh-CN', {
    timeZone: SHANGHAI_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};
