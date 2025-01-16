/**
 * lyric2Array.js
 * 将接口返回的歌词数据转化为数组格式
 */

/**
 * 格式化歌曲歌词数据
 * @param {string} lyric - 歌词字符串
 * @param {string} [tlyric] - 翻译歌词字符串（可选）
 * @returns {Object} - 格式化后的歌词对象
 */
export function formatMusicLyrics(lyric, tlyric) {
    if (lyric === '') {
        return { lyric: [{ time: 0, lyric: '暂无歌词', uid: 520520 }] };
    }

    const lyricObjArr = []; // 最终返回的歌词数组

    // 将歌曲字符串变成数组，数组每一项就是当前歌词信息
    const lineLyric = lyric?.split(/\n/);

    // 匹配中括号里的正则表达式
    const regTime = /\d{2}:\d{2}.\d{2,3}/;

    // 循环遍历歌曲数组
    for (let i = 0; i < lineLyric?.length; i++) {
        if (lineLyric[i] === '') continue;
        const timeMatch = lineLyric[i].match(regTime);
        if (!timeMatch) continue;

        const time = formatLyricTime(timeMatch[0]);

        if (lineLyric[i].split(']')[1] !== '') {
            lyricObjArr.push({
                time: time,
                lyric: lineLyric[i].split(']')[1],
                uid: parseInt(Math.random().toString().slice(-6)), // 生成随机 uid
            });
        }
    }

    console.log(lyricObjArr);

    return {
        lyric: lyricObjArr,
    };
}

/**
 * 格式化时间
 * @param {string} time - 时间字符串（格式为 mm:ss.ms 或 mm:ss.mss）
 * @returns {number} - 转换后的秒数
 */
function formatLyricTime(time: string): number {
    const regMin = /.*:/;
    const regSec = /:.*\./;
    const regMs = /\./;

    const min = parseInt(time.match(regMin)[0].slice(0, 2));
    let sec = parseInt(time.match(regSec)[0].slice(1, 3));
    const ms = time.slice(time.match(regMs).index + 1, time.match(regMs).index + 3);

    if (min !== 0) {
        sec += min * 60;
    }

    return Number(sec + '.' + ms);
}
