//应用程序的启动文件

var express = require('express');
var swig = require('swig');
var mongoose = require('mongoose');
var bodyParser = require('body-parser')
var session = require('express-session');
var Cookies = require('cookies')

var Geetest = require('./public/js/gt-sdk');
//创建app应用
var app = express();

var User = require('./models/user');

//设置静态文件托管
//当用户访问的url以/public开始,那么直接返回对应__dirname + '/public'下的文件
app.use('/public', express.static(__dirname + '/public'));

/*配置模板引用*/
app.engine('html', swig.renderFile);
//第一必须是views
app.set('views', './views');
//注册模板 第一个必须是view engine 第二必须和定义的engine的名称html一致
app.set('view engine', 'html');
//在开发过程中，需要取消模板缓存
swig.setDefaults({cache:false});

//bodyparser设置
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//设置session
app.use(session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: true
}));

//设置cookie
app.use(function(req, res, next) {
	req.cookies = new Cookies(req, res);
	
	//解析登录用户的登录信息
	req.userInfo = {};
	if (req.cookies.get('userInfo')) {
		try{
			req.userInfo = JSON.parse(req.cookies.get('userInfo'));

			//获取当前用户的类型,是否为管理员
			User.findById(req.userInfo._id).then(function(userInfo){
				req.userInfo.isAdmin = Boolean(userInfo.isAdmin);
				next();
			})
		}catch(e){
			next();
		}
	}else{
		next();
	}
})

/*划分模块*/
app.use('/admin', require('./routers/admin'));
app.use('/api', require('./routers/api'));
app.use('/', require('./routers/main'));


/*首页*/
app.get('/', function(req, res, next){
	//res.send("欢迎光临我的博客");
	/*读取views目录下的指定文件，解析并返回给客户端
	第一个参数是指定文件
	第二参数是传递给模板使用的数据*/
	res.render('index')
});



var fullpage = require('./public/js/fullpage');
app.get("/gt/register-fullpage", function (req, res) {
    // 向极验申请每次验证所需的challenge
    fullpage.register(null, function (err, data) {
        if (err) {
            console.error(err);
            res.status(500);
            res.send(err);
            return;
        }

        if (!data.success) {
            // 进入 failback，如果一直进入此模式，请检查服务器到极验服务器是否可访问
            // 可以通过修改 hosts 把极验服务器 api.geetest.com 指到不可访问的地址

            // 为以防万一，你可以选择以下两种方式之一：

            // 1. 继续使用极验提供的failback备用方案
            req.session.fallback = true;
            res.send(data);

            // 2. 使用自己提供的备用方案
            // todo

        } else {
            // 正常模式
            req.session.fallback = false;
            res.send(data);
        }
    });
});
app.post("/gt/validate-fullpage", function (req, res) {
    // 对ajax提供的验证凭证进行二次验证
    fullpage.validate(req.session.fallback, {
        geetest_challenge: req.body.geetest_challenge,
        geetest_validate: req.body.geetest_validate,
        geetest_seccode: req.body.geetest_seccode
    }, function (err, success) {

        if (err) {
            // 网络错误
            res.send({
                status: "error",
                info: err
            });

        } else if (!success) {

            // 二次验证失败
            res.send({
                status: "fail",
                info: '登录失败'
            });
        } else {

            res.send({
                status: "success",
                info: '登录成功'
            });
        }
    });
});



//监听http请求
mongoose.connect('mongodb://localhost:27018/node-blog', function(err) {
	if (err) {
		console.log('数据库连接失败')
	} else{
		console.log('数据库连接成功');
		app.listen(8081);
		console.log('app is starting...');
	}
});
