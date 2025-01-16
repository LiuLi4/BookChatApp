/**
 * 封装列表加载Hooks组件 useList
 * @param {Function} listReq 必传 -http请求函数
 * @param {String} listStr 必传 -匹配接口返回的列表字段（'list' => res.list)
 * @param {Object} pageData 必传 -分页数据配置项
 * @param {Object} data 可选 -额外传入参数（对象形式{key:value}）
 */

import { ref } from 'vue';

const useList = (listReq, listStr, pageData, data) => {
    const list = ref([]);

    if (!listReq) {
        throw new Error('请传入接口调用方法!');
    } else if (!listStr) {
        throw new Error('请传入接口返回列表字段!');
    } else if (!pageData) {
        throw new Error('请传入分页数据配置项!');
    }
    if (data && Object.prototype.toString.call(data) !== '[object Object]') {
        throw new Error('额外参数请以对象形式传入');
    }

    const params = { ...data }; // 携带参数

    const getData = () => {
        if (pageData.more === false) {
            uni.showToast({
                icon: "none",
                title: "没有更多了",
            });
            return;
        } else if (pageData.loading === true && list.value) {
            uni.showToast({
                icon: "none",
                title: "请勿频繁触发加载",
            });
            return;
        } else {
            pageData.loading = true;
            listReq(params).then((res) => {
                const lasttime = res.lasttime;
                const more = res.more;

                if (pageData.before <= 0 || pageData.page === 1) {
                    list.value = res[listStr];
                } else {
                    list.value.push(...res[listStr]);
                }

                pageData.init = true;
                pageData.loading = false;
                pageData.before = lasttime;
                pageData.more = more;
            });
        }
    };

    getData(); // 初始化获取接口数据

    return {
        list,
        getData,
    };
};

export default useList;