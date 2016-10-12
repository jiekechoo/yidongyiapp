/**
 * 演示程序当前的 “注册/登录” 等操作，是基于 “HttpBasic认证” 完成的
 * 当您要参考这个演示程序进行相关 app 的开发时，
 * 请注意将相关方法调整成 “基于服务端Service” 的实现。
 **/
(function($, owner) {
	var serverip = 'http://localhost:8080';

	// 当前状态是否连接
	var connected = false;

	// 当前登录的JID
	var jid = "";

	/**
	 * 用户登录
	 **/
	owner.login = function(loginInfo, callback) {
		callback = callback || $.noop;
		loginInfo = loginInfo || {};
		loginInfo.account = loginInfo.account || '';
		loginInfo.password = loginInfo.password || '';
		if(!checkMobile(loginInfo.account)) {
			return callback('请确认手机号码是否正确');
		}
		if(loginInfo.password.length < 6) {
			return callback('密码最短为 6 个字符');
		}

		mui.ajax(serverip + '/api/v1/i/userLogin', {
			data: '{ }',
			dataType: 'json', //服务器返回json格式数据
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			headers: {
				"Authorization": "Basic " + btoa(loginInfo.account + ":" + loginInfo.password)
			},
			success: function(data, status, xhr) {
				var cookie = xhr.getResponseHeader('set-cookie');
				//服务器返回响应，根据响应结果，分析是否登录成功；
				console.log("code: %s, message: %s, content: %s, cookie: %s",
					data.code, data.message, data.content, cookie);
				console.log(status);

				if(data.code == 1) {
					authed = true;
					//					plus.storage.setItem('cookie', cookie); //保存cookie
					return owner.createState(loginInfo.account, cookie, callback);
				} else {
					return callback("登录失败：" + data.message);
				}
			},
			error: function(xhr, type, errorThrown) {
				//异常处理；
				console.log(xhr.status, type, errorThrown);
				switch(xhr.status) {
					case 401:
						return callback("登录失败：用户名或密码错误！");
				}
				return callback("登录失败：访问服务器错误！");
			}
		});

	};

	owner.createState = function(name, cookie, callback) {
		var state = owner.getState();
		state.account = name;
		state.cookie = cookie;
		console.log("set state");
		owner.setState(state);
		return callback();
	};

	/**
	 * 新用户注册
	 **/
	owner.reg = function(regInfo, callback) {
		callback = callback || $.noop;
		regInfo = regInfo || {};
		regInfo.account = regInfo.account || '';
		regInfo.password = regInfo.password || '';
		if(!checkMobile(regInfo.account)) {
			return callback('请确认手机号码是否正确');
		}
		if(regInfo.password.length < 6) {
			return callback('密码最短需要 6 个字符');
		}
		mui.ajax(serverip + '/api/v1/create', {
			data: JSON.stringify({
				'username': regInfo.account,
				'password': regInfo.password
			}),
			dataType: 'json', //服务器返回json格式数据
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			contentType: 'application/json;',
			success: function(data) {
				//服务器返回响应，根据响应结果，分析是否登录成功；
				console.log(data.code);
				if(data.code == 1) {

					return app.login(regInfo, callback());
				} else {
					return callback("注册失败：" + data.message);
				}
			},
			error: function(xhr, type, errorThrown) {
				//异常处理；
				console.log(xhr, type, errorThrown);
				return callback("注册失败：服务器错误！");
			}
		});

	};

	/**
	 * 获取新闻列表
	 */
	owner.getNewsList = function() {
		mui.ajax(serverip + '/api/v1/news/getNewsList', {
			data: {},
			dataType: 'json',
			timeout: 10000, //超时时间设置为10秒；
			success: function(data, status, xhr) {
				console.info("get code: %s", data.code);
				return data;
			}
		});
	}

	/**
	 * 退出登录
	 */
	owner.logoutServer = function() {
		mui.ajax(serverip + '/logout', {
			data: {},
			timeout: 10000, //超时时间设置为10秒；
			success: function(data, status, xhr) {
				console.info("logout");
				return null;
			}
		});
	}

	/**
	 * 获取当前状态
	 **/
	owner.getState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		console.log("GET STATE:: state: %s", stateText);
		return JSON.parse(stateText);
	};

	/**
	 * 设置当前状态
	 **/
	owner.setState = function(state) {
		state = state || {};
		console.log("SET STATE:: account: %s, cookie: %s", state.account, state.cookie);
		localStorage.setItem('$state', JSON.stringify(state));
		//var settings = owner.getSettings();
		//settings.gestures = '';
		//owner.setSettings(settings);
	};

	var checkEmail = function(email) {
		email = email || '';
		return(email.length > 3 && email.indexOf('@') > -1);
	};

	var checkMobile = function(mobile) {
		mobile = mobile || '';
		var pattern = /^1[345789][0-9]{9}$/;
		return pattern.test(mobile);
	};

	/**
	 * 找回密码
	 **/
	owner.forgetPassword = function(mobile, callback) {
		callback = callback || $.noop;
		if(!checkMobile(mobile)) {
			return callback('手机号码不合法');
		}
		return callback(null, '新的随机密码已经发送到您的手机，请查看短信。');
	};

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
			var settingsText = localStorage.getItem('$settings') || "{}";
			return JSON.parse(settingsText);
		}
		/**
		 * 获取本地是否安装客户端
		 **/
	owner.isInstalled = function(id) {
		if(id === 'qihoo' && mui.os.plus) {
			return true;
		}
		if(mui.os.android) {
			var main = plus.android.runtimeMainActivity();
			var packageManager = main.getPackageManager();
			var PackageManager = plus.android.importClass(packageManager)
			var packageName = {
				"qq": "com.tencent.mobileqq",
				"weixin": "com.tencent.mm",
				"sinaweibo": "com.sina.weibo"
			}
			try {
				return packageManager.getPackageInfo(packageName[id], PackageManager.GET_ACTIVITIES);
			} catch(e) {}
		} else {
			switch(id) {
				case "qq":
					var TencentOAuth = plus.ios.import("TencentOAuth");
					return TencentOAuth.iphoneQQInstalled();
				case "weixin":
					var WXApi = plus.ios.import("WXApi");
					return WXApi.isWXAppInstalled()
				case "sinaweibo":
					var SinaAPI = plus.ios.import("WeiboSDK");
					return SinaAPI.isWeiboAppInstalled()
				default:
					break;
			}
		}
	}
}(mui, window.app = {}));