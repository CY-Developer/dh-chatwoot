import {
  format,
  isSameYear,
  fromUnixTime,
  formatDistanceToNow,
  differenceInDays,
  differenceInHours,
  isToday,
  isYesterday,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 上海时区常量
const SHANGHAI_TIMEZONE = 'Asia/Shanghai';

// 星期映射
const WEEKDAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/**
 * 将时间转换为上海时区
 * @param {Date} date - 日期对象
 * @returns {Date} 上海时区的日期对象
 */
const toShanghaiTime = (date) => {
  return new Date(date.toLocaleString('en-US', { timeZone: SHANGHAI_TIMEZONE }));
};

/**
 * 获取上海时区的时间部分 (HH:mm)
 * @param {Date} date - 日期对象
 * @returns {string} 时间字符串 如 "15:30"
 */
const getShanghaiTimeStr = (date) => {
  return date.toLocaleString('zh-CN', {
    timeZone: SHANGHAI_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * 【会话列表用】格式化时间戳
 * 一周内显示"星期x HH:mm"，一周前显示"yyyy/MM/dd"
 * @param {number} time - Unix timestamp
 * @returns {string} 格式化的时间字符串
 */
export const messageStamp = (time, dateFormat = 'h:mm a') => {
  const unixTime = fromUnixTime(time);
  const shanghaiTime = toShanghaiTime(unixTime);
  const now = toShanghaiTime(new Date());
  const daysDiff = differenceInDays(now, shanghaiTime);
  const hoursDiff = differenceInHours(now, shanghaiTime);

  // 1小时内显示"x分钟前"
  if (hoursDiff < 1) {
    const minutes = Math.floor((now - shanghaiTime) / 60000);
    if (minutes < 1) return '刚刚';
    return `${minutes}分钟前`;
  }

  // 今天显示时间
  if (isToday(shanghaiTime)) {
    return getShanghaiTimeStr(shanghaiTime);
  }

  // 昨天显示"昨天 HH:mm"
  if (isYesterday(shanghaiTime)) {
    return `昨天 ${getShanghaiTimeStr(shanghaiTime)}`;
  }

  // 一周内显示"星期x HH:mm"
  if (daysDiff < 7) {
    const weekday = WEEKDAY_NAMES[shanghaiTime.getDay()];
    return `${weekday} ${getShanghaiTimeStr(shanghaiTime)}`;
  }

  // 一周前显示 "yyyy/MM/dd"
  return shanghaiTime.toLocaleString('zh-CN', {
    timeZone: SHANGHAI_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '/');
};

/**
 * 【消息气泡用】格式化时间戳
 * 显示"x月x日 HH:mm"格式
 * @param {number} time - Unix timestamp
 * @param {string} [dateFormat] - 未使用，保持兼容
 * @returns {string} 格式化的时间字符串，如"12月4日 15:30"
 */
export const messageTimestamp = (time, dateFormat = 'MMM d, yyyy') => {
  const unixTime = fromUnixTime(time);
  const shanghaiTime = toShanghaiTime(unixTime);
  const now = toShanghaiTime(new Date());

  // 获取月日时分
  const month = shanghaiTime.getMonth() + 1;
  const day = shanghaiTime.getDate();
  const timeStr = getShanghaiTimeStr(shanghaiTime);

  // 不同年份显示年份
  if (shanghaiTime.getFullYear() !== now.getFullYear()) {
    const year = shanghaiTime.getFullYear();
    return `${year}年${month}月${day}日 ${timeStr}`;
  }

  // 同一年显示"x月x日 HH:mm"
  return `${month}月${day}日 ${timeStr}`;
};

/**
 * Converts a Unix timestamp to a relative time string (e.g., 3 hours ago).
 * @param {number} time - Unix timestamp.
 * @returns {string} Relative time string.
 */
export const dynamicTime = time => {
  const unixTime = fromUnixTime(time);
  return formatDistanceToNow(unixTime, { addSuffix: true, locale: zhCN });
};

/**
 * Formats a Unix timestamp into a specified date format (上海时区).
 * @param {number} time - Unix timestamp.
 * @param {string} [df] - 未使用
 * @returns {string} 格式化的日期字符串
 */
export const dateFormat = (time, df = 'MMM d, yyyy') => {
  const unixTime = fromUnixTime(time);
  const shanghaiTime = toShanghaiTime(unixTime);
  const month = shanghaiTime.getMonth() + 1;
  const day = shanghaiTime.getDate();
  const year = shanghaiTime.getFullYear();
  return `${year}年${month}月${day}日`;
};

/**
 * Converts a detailed time description into a shorter format, optionally appending 'ago'.
 * @param {string} time - Detailed time description (e.g., 'a minute ago').
 * @param {boolean} [withAgo=false] - Whether to append 'ago' to the result.
 * @returns {string} Shortened time description.
 */
export const shortTimestamp = (time, withAgo = false) => {
  const suffix = withAgo ? '前' : '';
  const timeMappings = {
    'less than a minute ago': '刚刚',
    'a minute ago': `1分钟${suffix}`,
    'an hour ago': `1小时${suffix}`,
    'a day ago': `1天${suffix}`,
    'a month ago': `1月${suffix}`,
    'a year ago': `1年${suffix}`,
  };
  if (timeMappings[time]) {
    return timeMappings[time];
  }
  const convertToShortTime = time
    .replace(/about|over|almost|/g, '')
    .replace(' minute ago', `分钟${suffix}`)
    .replace(' minutes ago', `分钟${suffix}`)
    .replace(' hour ago', `小时${suffix}`)
    .replace(' hours ago', `小时${suffix}`)
    .replace(' day ago', `天${suffix}`)
    .replace(' days ago', `天${suffix}`)
    .replace(' month ago', `月${suffix}`)
    .replace(' months ago', `月${suffix}`)
    .replace(' year ago', `年${suffix}`)
    .replace(' years ago', `年${suffix}`);
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
