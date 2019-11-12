const express = require('express'); //express框架模块
const path = require('path'); //系统路径模块
const app = express();

const port = 3001; //端口

app.use(express.static(path.join(__dirname, 'build'))); //指定静态文件目录
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/share/:pageId', (req, res, next) => {
    console.log(req.params.pageId)
    res.render('index', {pageId: req.params.pageId})
})

app.listen(port, function() {
    console.log(`服务器运行在http://:${port}`);
});