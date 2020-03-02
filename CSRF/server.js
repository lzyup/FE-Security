/**
 * 用户登录后，返回登录标识cookie
 */

const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const svgCaptcha = require('svg-captcha');

//设置路径
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static(path.join(__dirname, '/')));
//将参数转换为对象
app.use(bodyParser.urlencoded({ extended: true }));
//req.cookie[xxx] 获取cookie
app.use(cookieParser());

//用户列表
let userList = [{ username: 'luzy', password: 'luzy', account: 10000 }, { username: 'loki', password: 'loki', account: 100000 }];

let SESSION_ID = 'connect.sid';
let session = {};
//登录接口
app.post('/api/login', (req, res) => {
    let { username, password } = req.body;
    let user = userList.find(item => item.username === username && item.password == password);
    if (user) {
        //用户登录后，给一个标识(cookie登录)
        const cardId = Math.random() + Date.now();
        session[cardId] = { user };
        res.cookie(SESSION_ID, cardId);
        res.json({ code: 0 });
    } else {
        res.json({ code: 1, error: `${username} dose not exist or password mismatch` })
    }
})

app.get('/api/userinfo', (req, res) => {
    let info = session[req.cookies[SESSION_ID]];
    /**增加验证码 */
    //data:svg， text:验证码文本
    let { data, text } = svgCaptcha.create();
    if (info) {
        //用户已经登录
        let username = info.user.username;
        info.code = text; //下次请求时，对比验证码
        res.json({ code: 0, info: { username, account: info.user.account, svg: data } });
    } else {
        res.json({ code: 1, error: 'user not logged in.' });
    }
});

app.post('/api/transfer', (req, res) => {
    let info = session[req.cookies[SESSION_ID]];
    console.log('测试cookies---->', req.cookies);
    if (info) {
        //用户已经登录
        let { payee, amount } = req.body;
        let username = info.user.username;
        console.log('username--->', username);
        userList.forEach(user => {
            if (user.username === username) {
                user.account -= amount;
            }
            if (user.username === payee) {
                user.account += amount;
            }
        })
        res.json({ code: 0 });
    } else {
        res.json({ code: 1, error: 'user not logged in.' });
    }
});


//转账前，先验证 验证码
app.post('/api/transfer1', (req, res) => {
    let info = session[req.cookies[SESSION_ID]];
    if (info) {
        //用户登录
        let { payee, amount, code } = req.body;
        console.log('测试安全转账1--->', req.body);
        console.log('code.toUpperCase---->', code.toUpperCase());
        console.log('info.code.toUpperCase->', info.code.toUpperCase());
        if (code && code.toUpperCase() === info.code.toUpperCase() && Number(amount)) {
            //验证码正确
            let username = info.user.username;
            userList.forEach(user => {
                if (user.username === username) {
                    user.account -= amount;
                }
                if (user.username === payee) {
                    user.account += amount;
                }
            })
            console.log('测试userList--->', userList);
            res.json({ code: 0 })
        } else {
            res.json({ code: 1, error: 'code error' })
        }
    } else {
        res.json({ code: 1, error: 'user not logged in.' })
    }
})

//转账前，判断请求来源(referer)
app.post('/api/transfer2', (req, res) => {
    let info = session[req.cookies[SESSION_ID]];
    console.log('transfer2----->',info);
    console.log('cookies----->',req.cookies);
    if (info) {
        //用户已登录
        let { payee, amount } = req.body;
        let referer = req.headers['referer'] || '';
        console.log('referer----->',referer);
        console.log('header------>',req.headers);
        if (Number(amount) && referer.includes('localhost:3001')) {
            //referer正确
            let username = info.user.username;
            userList.forEach(user => {
                if (user.username == username) {
                    user.account -= amount;
                }
                if (user.username === payee) {
                    user.account += amount;
                }
            })
            res.json({ code: 0 })
        } else {
            res.json({ code: 1, error: 'illegal source of request' })
        }
    } else {
        res.json({ code: 1, error: 'user not logged in.' })
    }
})

//转账前，先验证token
app.post('/api/transfer3', (req, res) => {
    let info = session[req.cookies[SESSION_ID]];
    if (info) {
        //用户已登录
        let { payee, amount, token } = req.body;
        console.log(token, 'mytoken_' + req.cookies[SESSION_ID]);
        if (token === 'mytoken_' + req.cookies[SESSION_ID] && Number(amount)) {
            //token正确
            let username = info.user.username;
            userList.forEach(user => {
                if (user.username === username) {
                    user.account -= amount;
                }
                if (user.username === payee) {
                    user.account += amount;
                }
            })
            res.json({ code: 0 })
        } else {
            res.json({ code: 1, error: 'illegal' });
        }
    } else {
        res.json({ code: 1, error: 'user not logged in.' })
    }
})


app.listen(3001);   