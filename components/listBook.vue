<template>
	<view class='book-list'>
		<block v-for="(book,index) in showBooks" :key='index'>
			<view class='row'>
				<navigator :url="'/pages/read/book?id='+book.id" class='col-3'>
					<image :lazy-load='true' class='box-shadow cover' :src='book.image_url' />
				</navigator>
				<navigator :url="'/pages/read/book?id='+book.id" class='col-9'>
					<view class='font-lv1 mgb-15 ellipsis-1row'>{{book.name}}</view>
					<view class='font-lv4 color-light info'>
						<view class='col'>
							<image src='/static/images/eye.png'></image>
							<text>{{book.view}} 阅读</text>
						</view>
						<view class="col">
							<image src='/static/images/document.png'></image>
							<text>{{book.cnt_doc}} 章节</text>
						</view>
						<view class='col'>
							<image src='/static/images/clock.png'></image>
							<text>{{book.create_time}}</text>
						</view>
					</view>
					<view class='font-lv3 color-grey ellipsis-2row'>{{book.description ? book.description : book.name}}</view>
				</navigator>
			</view>
		</block>
	</view>
</template>

<script>
	import util from '../utils/util.js'
	export default {
		name: 'listBook',
		data() {
			return {
				showBooks: [],
			};
		},
		props: {
			books: {
				type: Array
			}
		},
		created() {
			this.showBooks = this.formateBooks(this.books)
		},
		watch: {
			books: function() {
				this.showBooks = this.formateBooks(this.books)
			}
		},
		methods: {
			formateBooks(books) {
				let data = []
				for (let book of this.books) {
					book['view'] = util.fixView(book.view)
					book['created_at'] = util.relativeTime(book.created_at)
					data.push(book)
				}
				return data
			}
		}
	}
</script>

<style>
	.book-list .col-9 {
		box-sizing: border-box;
		padding-left: 15px;
	}

	.book-list .row {
		margin-bottom: 15px;
		padding-bottom: 15px;
		border-bottom: 1px solid #efefef;
		display: flex;
	}

	.book-list .color-grey {
		line-height: 150%;
		/* text-indent: 2em; */
	}

	.book-list .cover {
		width: 85px;
		max-width: 100%;
		height: 112px;
	}

	.book-list .info {
		box-sizing: border-box;
		border-bottom: 0 !important;
		display: flex;
		margin: 10px 0;
	}

	.book-list .info .col {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.book-list .info image {
		width: 12px;
		height: 12px;
		/* position: relative; */
		/* top: 2px; */
		margin-right: 3px;
	}

	.book-list .icon {
		width: 32px;
		height: 32px;
		margin: 0 auto;
		display: block;
	}

	.book-list .row:last-of-type {
		border-bottom: 0;
		margin-bottom: 0;
		padding-bottom: 0;
	}
	
	@media (min-width:768px) {
		.ellipsis-2row{
			text-overflow: ellipsis;
			display: -webkit-box;
			-webkit-line-clamp: 3;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}
		.book-list .color-grey{
			line-height: 200%;
		}
		.book-list .info image{
			max-width: 18px;
			max-height: 18px;
			/* top:3px; */
		}
		.book-list .cover {
			max-width: 100%;
			width: 170px;
			height: 223.5px;
		}
	}
</style>
