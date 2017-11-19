
var mongoose = require('mongoose');

//内容的表结构
module.exports = new mongoose.Schema({
	//关联字段 -内容分类的id
	category: {
		//类型
		type: mongoose.Schema.Types.ObjectId,
		//引用
		ref: 'Category'
	},
	//内容标题
	title: String,

	//关联字段 -内容分类的id
	user: {
		//类型
		type: mongoose.Schema.Types.ObjectId,
		//引用
		ref: 'User'
	},
	//default不能设置为 new Date()时间会显示错误
	addTime: {
		type: Date,
		default: Date.now
	},

	views:{
		type: Number,
		default: 0
	},
	//简介
	description: {
		type: String,
		default: ''
	},
	//内容
	content: {
		type:String,
		default: ''
	},

	comments: {
		type: Array,
		default: []
	}
});