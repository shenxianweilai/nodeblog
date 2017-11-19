$(function(){

	var $loginBox = $('#loginBox');

	var handler = function (captchaObj) {
        captchaObj.appendTo('#captcha'); // 同时插入三个input表单时，geetest_challenge, geetest_validate, geetest_seccode
        captchaObj.onReady(function () {
        	$("#wait").hide();
        });
        $loginBox.find('button').on('click', function(e) {
        	var result = captchaObj.getValidate();
        	if (!result) {
        		e.preventDefault();
        		return alert('请完成验证');
        	}else{
        		$.ajax({
					type: 'post',
					url: '/api/user/login',
					data: {
						username: $loginBox.find('[name="username"]').val(),
						password: $loginBox.find('[name="password"]').val()
					},
					dataType: 'json',
					success: function(result) {
						$loginBox.find('.colWarning').html(result.message);
						if (!result.code) {
							//登录成功
							window.location.reload();
						}
					}
				})
        	}
        })
        // 更多接口说明请参见：http://docs.geetest.com/install/client/web-front/
    };


    $.ajax({
        url: "gt/register-fullpage?t=" + (new Date()).getTime(), // 加随机数防止缓存
        type: "get",
        dataType: "json",
        success: function (data) {
            // 调用 initGeetest 进行初始化
            // 参数1：配置参数
            // 参数2：回调，回调的第一个参数验证码对象，之后可以使用它调用相应的接口
            initGeetest({
                // 以下 4 个配置参数为必须，不能缺少
                gt: data.gt,
                challenge: data.challenge,
                offline: !data.success, // 表示用户后台检测极验服务器是否宕机
                new_captcha: data.new_captcha, // 用于宕机时表示是新验证码的宕机

                product: "float", // 产品形式，包括：float，popup
                width: "300px"
                // 更多配置参数说明请参见：http://docs.geetest.com/install/client/web-front/
            }, handler);
        }
    });
})