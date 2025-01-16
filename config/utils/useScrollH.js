/**
 * Hooks 动态计算 scrollList 滑动区域高度
 * @param {Number} offset 可选 - offset 偏移量 手动微调 scroll 高度
 */

import { ref, getCurrentInstance } from 'vue';

export const useScrollHeight = (offset = 3) => {
    const scrollHeight = ref(0); // scroll 组件高度
    const topHeight = ref(0); // 组件上方占用高度
    const currentInstance = getCurrentInstance(); // Vue3 绑定 this
    const height = uni.getSystemInfoSync().windowHeight; // 获取页面高度
    const topEl = uni.createSelectorQuery().in(currentInstance).select('#top'); // 获取 #top 元素

    topEl.boundingClientRect((data) => {
        // 检查 data 是否是数组类型
        if (Array.isArray(data)) {
            data = data[0]; // 如果是数组，取第一个元素
        }

        if (data && data.height !== undefined) {
            topHeight.value = data.height;
            console.log(topHeight.value);
            scrollHeight.value = height - topHeight.value - (offset || 0); // 计算剩余高度 offset 偏移量
            console.log(scrollHeight.value);
        }
    }).exec();

    return scrollHeight;
};