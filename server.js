// 引入相关模块
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const mime = require('mime');


function readStaticFile(res, filePathname) {

    const ext = path.parse(filePathname).ext;
    const mimeType = mime.getType(ext);
    
    // 判断路径是否有后缀, 有的话则说明客户端要请求的是一个文件 
    if (ext) {
        // 根据传入的目标文件路径来读取对应文件
        fs.readFile(filePathname, (err, data) => {
            // 错误处理
            if (err) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.write("404 - NOT FOUND");
                res.end();
            } else {
                res.writeHead(200, { "Content-Type": mimeType });
                res.write(data);
                res.end();
            }
        });
        // 返回 false 表示, 客户端想要的 是 静态文件
        return true;
    } else {
        // 返回 false 表示, 客户端想要的 不是 静态文件
        return false;
    }
}

// 搭建 HTTP 服务器
const server = http.createServer(function(req, res) {
    const urlPathname = url.parse(req.url).pathname;
    // 处理根请求，重定向到/index.html
    if (urlPathname === '/') {
        readStaticFile(res, path.join(__dirname, "/build", '/index.html'));
    } else if(urlPathname.startsWith('/share/')) { // 处理 editor 的 pageRender
        const uuid = urlPathname.slice(7, urlPathname.length)
        res.setHeader("Content-Type","text/html;charset='utf-8'");
        res.end(`<!DOCTYPE html>
            <html>
            <head lang="en">
                <meta charset="UTF-8">
                <title>${uuid}</title>
                <script src="https://cdn.bootcss.com/react/16.10.2/umd/react.production.min.js"></script>
                <script src="https://cdn.bootcss.com/react-dom/16.10.2/umd/react-dom.production.min.js"></script>
                <link rel="stylesheet" href="http://officespace2.oss-cn-beijing.aliyuncs.com/${uuid}.css">
            </head>
            <body>
                <div id="root">loading...</div>
                <script src="http://officespace2.oss-cn-beijing.aliyuncs.com/${uuid}.js"></script>
            </body>
            </html>
        `);
    } else {
        const filePathname = path.join(__dirname, "/build", urlPathname);
        // 读取静态文件
        const result = readStaticFile(res, filePathname);
        if (!result) {
            readStaticFile(res, path.join(__dirname, "/build", '/index.html'));
        }
    }
});

server.listen(80)
