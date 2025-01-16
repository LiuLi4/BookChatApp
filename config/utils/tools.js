// 封装常用工具函数

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖处理的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} - 防抖处理后的函数
 */
export const debounce = (fn, delay) => {
    const delays = delay || 500;
    let timer = null;

    return function (...args) {
        const _this = this;
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(function () {
            fn.apply(_this, args);
        }, delays);
    };
};

/**
 * 节流函数
 * @param {Function} fn - 需要节流处理的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} - 节流处理后的函数
 */
export const throttle = (fn, delay) => {
    const delays = delay || 500;
    let timer = null;

    return function (...args) {
        const _this = this;
        if (!timer) {
            timer = setTimeout(() => {
                timer = null;
                fn.apply(_this, args);
            }, delays);
        }
    };
};