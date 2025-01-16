// 全局初始化 audio 实例，解决微信小程序无法正常使用 Pinia 调用 audio 实例的 bug
let innerAudioContext = null;

/**
 * 创建播放器实例
 * @returns {Object} innerAudioContext 实例
 */
export function createPlayer() {
	if (!innerAudioContext) {
		innerAudioContext = typeof uni.getBackgroundAudioManager === 'function'
			? uni.getBackgroundAudioManager()
			: uni.createInnerAudioContext();
	}
	return innerAudioContext;
}

/**
 * 获取播放器实例
 * @returns {Object|null} innerAudioContext 实例
 */
export function getPlayer() {
	if (!innerAudioContext) {
		console.warn('Audio instance not initialized. Call createPlayer() first.');
	}
	return innerAudioContext;
}