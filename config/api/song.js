import config from '../../config.js'
import {
	request
} from '../../utils/util.js'; // 引入封装的request方法

// 获取音乐url
export async function getSongUrl(id) {
	const {
		data
	} = await request(config.api.songUrl, {
		id: id, // 传递参数
	});
	return data[0];
}

// 获取歌曲详情
export async function getSongDetail(id) {
	const {
		songs
	} = await request(config.api.songDetail, {
		ids: id, // 传递参数
	});
	return songs[0];
}

// 获取歌曲歌词
export async function getSongLyric(id) {
	const {
		lrc
	} = await request(config.api.songLyric, {
		id: id, // 传递参数
	});
	return lrc;
}