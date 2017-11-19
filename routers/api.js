var express = require('express');
var router = express.Router();
var User = require('../models/User');
var Content = require('../models/Content');

var GeeTest = require('../public/js/gt-sdk');
var fullpage = require('../public/js/fullpage');

router.get("/gt/register-fullpage", function(req, res) {
	fullpage.register(null, function(err, data) {
		if (err) {
			console.log(err);
			res.statucs(500);
			res.send(err);
			return;
		}

		if (!data.success) {
			req.session.fallback = true;
			res.send(data);
		}else{
			req.session.fallback = false;
			res.send(data);
		}
	});
});

router.post("/gt/validate-fullpage", function(req, res){

	fullpage.validate(req.session.fallback, {
		geetest_challenge: req.body.geetest_challenge,
		geetest_validate: req.body.geetest_validate,
		geetest_seccode: req.body.geetest_seccode
	}, function(err, success) {
		if (err) {
			res.send({
				status: "error",
				info: err
			});
		}else if (!success) {
			res.send({
				status: 'fail',
				info: '登录失败'
			});
		}else{

			res.send({
				status: "success",
				info: '登录成功'
			});
		}
	});
});

//统一返回格式
var responseData;

router.use(function(req, res, next){
	responseData = {
		code: 0,
		message: ''
	}

	next();
});

/*用户注册
	注册逻辑
	1.用户名不能为空
	2.密码不能为空
	3.两次密码一致

	1用户名是否已经注册  数据库查询*/
router.post('/user/register', function(req, res, next){
	var username = req.body.username;
	var password = req.body.password;
	var repassword = req.body.repassword;

	//用户名是否为空
	if (username == '') {
		responseData.code = 1;
		responseData.message = '用户名不能为空';
		res.json(responseData);
		return;
	}
	//密码不能为空
	if (password == '') {
		responseData.code = 2;
		responseData.message = '密码不能为空';
		res.json(responseData);
		return;
	}
	//两次的密码不一致
	if (password != repassword) {
		responseData.code = 3;
		responseData.message ="两次密码不一致"
		res.json(responseData);
		return;
	}
	//用户名是否已经被注册了，如果数据库已经存在和我们要注册的用户名同名的数据，表示该用户已经被注册
	User.findOne({
		username: username
	}).then(function(userInfo){
		if (userInfo) {
			responseData.code = 4;
			responseData.message = '用户名已经存在';
			res.json(responseData);
			return;
		}
		//保存用户注册的信息到数据库中
		var user = new User({
			username: username,
			password: password
		});
		return user.save();
	}).then(newUserInfo => {
		responseData.message = '注册成功!';
		res.json(responseData);
	});	
});

/*登录*/
router.post('/user/login', function(req, res){
	var username = req.body.username;
	var password = req.body.password;

	if (username == '' || password == '') {
		responseData.code = 1;
		responseData.message = '用户名和密码不能为空';
		res.json(responseData);
		return;
	}

	//查询数据库中相同用户名和密码的记录是否存在，如果存在则登录成功
	User.findOne({
		username: username,
		password: password
	}).then(function(userInfo){
		if (!userInfo) {
			responseData.code = 2;
			responseData.message = '用户名或者密码错误';
			res.json(responseData);
			return;
		}
			//用户名和密码正确
		responseData.message = '登录成功';
		responseData.userInfo = {
			_id: userInfo._id,
			username: userInfo.username
		}
		//发送一个cookie到浏览器
		req.cookies.set('userInfo', JSON.stringify({
			_id: userInfo._id,
			username: userInfo.username
		}));
		res.json(responseData);
		return; 
	})
});

/*退出*/
router.get('/user/logout', function(req, res) {
	req.cookies.set('userInfo', null);
	res.json(responseData);
})

/*
获取所有评论*/
router.get('/comment', function(req, res){
	var contentId = req.query.contentid || '';

	Content.findOne({
		_id: contentId
	}).then(function(content){
		responseData.data = content.comments;
		res.json(responseData);
	})
});

/*
评论提交*/
router.post('/comment/post', function(req, res){
	//内容id
	var contentId = req.body.contentid || '';
	var postData = {
		username: req.userInfo.username,
		postTime: new Date(),
		content: req.body.content,
	};

	//查询当前这篇内容的信息
	Content.findOne({
		_id: contentId
	}).then(function(content){
		content.comments.push(postData);
		return content.save();
	}).then(function(newContent){
		responseData.message = '评论成功';
		responseData.data = newContent;
		res.json(responseData);
	})
});


module.exports = router;